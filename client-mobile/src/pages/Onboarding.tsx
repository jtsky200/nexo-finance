import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/contexts/AuthContext';
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

export default function MobileOnboarding() {
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
          setLocation('/');
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
      setLocation('/');
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
      setLocation('/');
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Lade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">Willkommen bei Nexo</h1>
        <p className="text-muted-foreground text-sm">
          Schritt {currentStep} von 3: Richten Sie Ihr Konto ein
        </p>
        <div className="mt-4 w-full bg-muted rounded-full h-2">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentStep / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Step 1: Personal Data */}
      {currentStep === 1 && (
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Ihr Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Max Mustermann"
              className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Währung</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as 'CHF' | 'EUR' | 'USD')}
              className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
            >
              <option value="CHF">CHF (Schweizer Franken)</option>
              <option value="EUR">EUR (Euro)</option>
              <option value="USD">USD (US-Dollar)</option>
            </select>
          </div>
        </div>
      )}

      {/* Step 2: Children */}
      {currentStep === 2 && (
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Anzahl Kinder</label>
            <select
              value={numberOfChildren.toString()}
              onChange={(e) => setNumberOfChildren(parseInt(e.target.value, 10))}
              className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num.toString()}>
                  {num}
                </option>
              ))}
            </select>
          </div>

          {numberOfChildren > 0 && (
            <div className="space-y-4">
              {children.map((child, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-lg">
                  <label className="block text-sm font-medium">Kind {index + 1}</label>
                  <input
                    type="text"
                    value={child.name}
                    onChange={(e) => {
                      const newChildren = [...children];
                      newChildren[index].name = e.target.value;
                      setChildren(newChildren);
                    }}
                    placeholder="Name des Kindes"
                    className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                    required
                  />
                  <input
                    type="date"
                    value={child.birthDate || ''}
                    onChange={(e) => {
                      const newChildren = [...children];
                      newChildren[index].birthDate = e.target.value;
                      setChildren(newChildren);
                    }}
                    placeholder="Geburtsdatum (optional)"
                    className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Step 3: Household Members */}
      {currentStep === 3 && (
        <div className="flex-1 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Anzahl weitere Haushaltsmitglieder</label>
            <select
              value={numberOfHouseholdMembers.toString()}
              onChange={(e) => setNumberOfHouseholdMembers(parseInt(e.target.value, 10))}
              className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
            >
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num.toString()}>
                  {num}
                </option>
              ))}
            </select>
          </div>

          {numberOfHouseholdMembers > 0 && (
            <div className="space-y-4">
              {householdMembers.map((member, index) => (
                <div key={index} className="space-y-2 p-4 border rounded-lg">
                  <label className="block text-sm font-medium">Haushaltsmitglied {index + 1}</label>
                  <input
                    type="text"
                    value={member.name}
                    onChange={(e) => {
                      const newMembers = [...householdMembers];
                      newMembers[index].name = e.target.value;
                      setHouseholdMembers(newMembers);
                    }}
                    placeholder="Name"
                    className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                    required
                  />
                  <input
                    type="email"
                    value={member.email || ''}
                    onChange={(e) => {
                      const newMembers = [...householdMembers];
                      newMembers[index].email = e.target.value;
                      setHouseholdMembers(newMembers);
                    }}
                    placeholder="E-Mail (optional)"
                    className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                  />
                  <input
                    type="tel"
                    value={member.phone || ''}
                    onChange={(e) => {
                      const newMembers = [...householdMembers];
                      newMembers[index].phone = e.target.value;
                      setHouseholdMembers(newMembers);
                    }}
                    placeholder="Telefon (optional)"
                    className="w-full h-12 px-4 rounded-lg text-base bg-background border border-border outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-3 mt-6 pt-6 border-t">
        <div>
          {currentStep > 1 && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isLoading}
              className="h-12 px-6 rounded-lg font-medium text-base border border-border bg-background active:bg-muted disabled:opacity-50"
            >
              Zurück
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {currentStep < 3 && (
            <>
              <button
                type="button"
                onClick={handleSkip}
                disabled={isLoading}
                className="h-12 px-6 rounded-lg font-medium text-base text-muted-foreground active:opacity-80 disabled:opacity-50"
              >
                Überspringen
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={isLoading}
                className="h-12 px-6 rounded-lg font-medium text-base bg-primary text-primary-foreground active:opacity-80 disabled:opacity-50"
              >
                Weiter
              </button>
            </>
          )}
          {currentStep === 3 && (
            <button
              type="button"
              onClick={handleComplete}
              disabled={isLoading}
              className="h-12 px-6 rounded-lg font-medium text-base bg-primary text-primary-foreground active:opacity-80 disabled:opacity-50"
            >
              {isLoading ? 'Wird gespeichert...' : 'Abschliessen'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

