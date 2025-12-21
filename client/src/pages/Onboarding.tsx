import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { createPerson } from '@/lib/firebaseHooks';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

interface Child {
  name: string;
  birthDate?: string;
}

interface HouseholdMember {
  name: string;
  email?: string;
  phone?: string;
}

export default function Onboarding() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);

  // Step 1: Personal Data
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState<'CHF' | 'EUR' | 'USD'>('CHF');

  // Step 2: Children
  const [numberOfChildren, setNumberOfChildren] = useState(0);
  const [children, setChildren] = useState<Child[]>([]);

  // Step 3: Household Members
  const [numberOfHouseholdMembers, setNumberOfHouseholdMembers] = useState(0);
  const [householdMembers, setHouseholdMembers] = useState<HouseholdMember[]>([]);

  // Check if user has already completed onboarding
  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (!user) {
        setLocation('/login');
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists() && userDoc.data().onboardingCompleted) {
          setLocation('/dashboard');
          return;
        }
        
        // Pre-fill name from user profile
        if (user.displayName) {
          setName(user.displayName);
        }
      } catch (error) {
        console.error('Error checking onboarding status:', error);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    checkOnboardingStatus();
  }, [user, setLocation]);

  // Initialize children array when numberOfChildren changes
  useEffect(() => {
    if (numberOfChildren > 0) {
      setChildren(prev => {
        const newChildren = [...prev];
        while (newChildren.length < numberOfChildren) {
          newChildren.push({ name: '' });
        }
        while (newChildren.length > numberOfChildren) {
          newChildren.pop();
        }
        return newChildren;
      });
    } else {
      setChildren([]);
    }
  }, [numberOfChildren]);

  // Initialize household members array when numberOfHouseholdMembers changes
  useEffect(() => {
    if (numberOfHouseholdMembers > 0) {
      setHouseholdMembers(prev => {
        const newMembers = [...prev];
        while (newMembers.length < numberOfHouseholdMembers) {
          newMembers.push({ name: '', email: '', phone: '' });
        }
        while (newMembers.length > numberOfHouseholdMembers) {
          newMembers.pop();
        }
        return newMembers;
      });
    } else {
      setHouseholdMembers([]);
    }
  }, [numberOfHouseholdMembers]);

  const handleNext = () => {
    if (currentStep === 1) {
      if (!name.trim()) {
        toast.error('Bitte geben Sie Ihren Namen ein');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      // Validate children if any
      if (numberOfChildren > 0) {
        const invalidChildren = children.filter(c => !c.name.trim());
        if (invalidChildren.length > 0) {
          toast.error('Bitte geben Sie für alle Kinder einen Namen ein');
          return;
        }
      }
      setCurrentStep(3);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      // Mark onboarding as completed
      await setDoc(doc(db, 'users', user.uid), {
        onboardingCompleted: true,
        name: name.trim() || user.displayName || user.email?.split('@')[0] || 'User',
        currency,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });

      toast.success('Onboarding abgeschlossen');
      setLocation('/dashboard');
    } catch (error: any) {
      toast.error('Fehler beim Speichern: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    try {
      setIsLoading(true);

      // Validate household members if any
      if (numberOfHouseholdMembers > 0) {
        const invalidMembers = householdMembers.filter(m => !m.name.trim());
        if (invalidMembers.length > 0) {
          toast.error('Bitte geben Sie für alle Haushaltsmitglieder einen Namen ein');
          setIsLoading(false);
          return;
        }
      }

      // Save user data
      await setDoc(doc(db, 'users', user.uid), {
        onboardingCompleted: true,
        name: name.trim() || user.displayName || user.email?.split('@')[0] || 'User',
        currency,
        createdAt: new Date(),
        updatedAt: new Date(),
      }, { merge: true });

      // Create children
      if (numberOfChildren > 0) {
        const childrenPromises = children
          .filter(c => c.name.trim())
          .map(child => 
            createPerson({
              name: child.name.trim(),
              type: 'child',
              currency,
              notes: child.birthDate ? `Geburtsdatum: ${child.birthDate}` : null,
            })
          );
        await Promise.all(childrenPromises);
      }

      // Create household members
      if (numberOfHouseholdMembers > 0) {
        const memberPromises = householdMembers
          .filter(m => m.name.trim())
          .map(member =>
            createPerson({
              name: member.name.trim(),
              email: member.email?.trim() || null,
              phone: member.phone?.trim() || null,
              type: 'household',
              currency,
            })
          );
        await Promise.all(memberPromises);
      }

      toast.success('Onboarding erfolgreich abgeschlossen');
      setLocation('/dashboard');
    } catch (error: any) {
      toast.error('Fehler beim Speichern: ' + error.message);
      console.error('Onboarding error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-muted-foreground">Lade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl">Willkommen bei Nexo</CardTitle>
          <CardDescription>
            Schritt {currentStep} von 3: Richten Sie Ihr Konto ein
          </CardDescription>
          <div className="mt-4 w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 3) * 100}%` }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {/* Step 1: Personal Data */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Ihr Name</Label>
                <Input
                  id="name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Max Mustermann"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Währung</Label>
                <Select value={currency} onValueChange={(value: 'CHF' | 'EUR' | 'USD') => setCurrency(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CHF">CHF (Schweizer Franken)</SelectItem>
                    <SelectItem value="EUR">EUR (Euro)</SelectItem>
                    <SelectItem value="USD">USD (US-Dollar)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Step 2: Children */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfChildren">Anzahl Kinder</Label>
                <Select
                  value={numberOfChildren.toString()}
                  onValueChange={(value) => setNumberOfChildren(parseInt(value, 10))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {numberOfChildren > 0 && (
                <div className="space-y-4">
                  {children.map((child, index) => (
                    <div key={index} className="space-y-2 p-4 border rounded-lg">
                      <Label>Kind {index + 1}</Label>
                      <Input
                        type="text"
                        value={child.name}
                        onChange={(e) => {
                          const newChildren = [...children];
                          newChildren[index].name = e.target.value;
                          setChildren(newChildren);
                        }}
                        placeholder="Name des Kindes"
                        required
                      />
                      <Input
                        type="date"
                        value={child.birthDate || ''}
                        onChange={(e) => {
                          const newChildren = [...children];
                          newChildren[index].birthDate = e.target.value;
                          setChildren(newChildren);
                        }}
                        placeholder="Geburtsdatum (optional)"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Household Members */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="numberOfHouseholdMembers">Anzahl weitere Haushaltsmitglieder</Label>
                <Select
                  value={numberOfHouseholdMembers.toString()}
                  onValueChange={(value) => setNumberOfHouseholdMembers(parseInt(value, 10))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {numberOfHouseholdMembers > 0 && (
                <div className="space-y-4">
                  {householdMembers.map((member, index) => (
                    <div key={index} className="space-y-2 p-4 border rounded-lg">
                      <Label>Haushaltsmitglied {index + 1}</Label>
                      <Input
                        type="text"
                        value={member.name}
                        onChange={(e) => {
                          const newMembers = [...householdMembers];
                          newMembers[index].name = e.target.value;
                          setHouseholdMembers(newMembers);
                        }}
                        placeholder="Name"
                        required
                      />
                      <Input
                        type="email"
                        value={member.email || ''}
                        onChange={(e) => {
                          const newMembers = [...householdMembers];
                          newMembers[index].email = e.target.value;
                          setHouseholdMembers(newMembers);
                        }}
                        placeholder="E-Mail (optional)"
                      />
                      <Input
                        type="tel"
                        value={member.phone || ''}
                        onChange={(e) => {
                          const newMembers = [...householdMembers];
                          newMembers[index].phone = e.target.value;
                          setHouseholdMembers(newMembers);
                        }}
                        placeholder="Telefon (optional)"
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-6">
            <div>
              {currentStep > 1 && (
                <Button type="button" variant="outline" onClick={handleBack} disabled={isLoading}>
                  Zurück
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              {currentStep < 3 && (
                <>
                  <Button type="button" variant="ghost" onClick={handleSkip} disabled={isLoading}>
                    Überspringen
                  </Button>
                  <Button type="button" onClick={handleNext} disabled={isLoading}>
                    Weiter
                  </Button>
                </>
              )}
              {currentStep === 3 && (
                <Button type="button" onClick={handleComplete} disabled={isLoading}>
                  {isLoading ? 'Wird gespeichert...' : 'Abschliessen'}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

