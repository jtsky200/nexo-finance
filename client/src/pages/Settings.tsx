import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import Layout from '@/components/Layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { httpsCallable } from 'firebase/functions';
import { functions, storage, db } from '@/lib/firebase';
import { useUserSettings } from '@/lib/firebaseHooks';
import { collection, query, where, orderBy, limit, getDocs, addDoc, deleteDoc, doc, Timestamp } from 'firebase/firestore';
import { deleteUser, signOut } from 'firebase/auth';
import { 
  updateProfile, 
  updatePassword, 
  reauthenticateWithCredential,
  EmailAuthProvider,
  verifyBeforeUpdateEmail,
  sendEmailVerification,
  RecaptchaVerifier,
  PhoneAuthProvider,
  PhoneMultiFactorGenerator,
  multiFactor,
  getMultiFactorResolver,
  linkWithCredential,
  unlink
} from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { auth } from '@/lib/firebase';
import { User, Mail, Globe, Wallet, MapPin, Bell, Moon, Sun, Loader2, FileSearch, Eye, EyeOff, Lock, Camera, X, Shield, History, Download, Upload, Trash2, Monitor, Smartphone, Tablet, LogOut, AlertTriangle, Key, Cloud, Clock, BarChart3, Settings2, Smartphone as SmartphoneIcon, QrCode, Fingerprint, Plus, Phone } from 'lucide-react';
import i18n from '@/lib/i18n';
import { setDoc, getDoc } from 'firebase/firestore';

// Format phone number with spaces based on country code
const formatPhoneNumber = (value: string): string => {
  if (!value || value.trim() === '') return '';
  const cleaned = value.replace(/[^\d+]/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length > 0) {
      return '+' + cleaned;
    }
    return cleaned;
  }
  
  // Known 2-digit country codes (check these first to avoid greedy matching)
  const twoDigitCodes = ['41', '49', '43', '33', '39', '34', '31', '32', '44', '45', '46', '47', '48', '30', '90', '91', '81', '82', '86'];
  const digitsOnly = cleaned.slice(1); // Remove the +
  
  let countryCode = '';
  let number = '';
  
  // Check for known 2-digit country codes first
  for (const code of twoDigitCodes) {
    if (digitsOnly.startsWith(code)) {
      countryCode = code;
      number = digitsOnly.slice(code.length);
      break;
    }
  }
  
  // If no known 2-digit code found, use generic matching
  if (!countryCode) {
    const match = cleaned.match(/^\+(\d{1,3})(.*)$/);
    if (!match) return cleaned;
    countryCode = match[1];
    number = match[2].replace(/\D/g, '');
  }
  
  if (number.length === 0) {
    return `+${countryCode}`;
  }
  
  let formatted = `+${countryCode}`;
  
  // Swiss format: +41 79 XXX XX XX
  if (countryCode === '41' && number.length > 0) {
    if (number.length <= 2) {
      formatted += ' ' + number;
    } else if (number.length <= 5) {
      formatted += ' ' + number.slice(0, 2) + ' ' + number.slice(2);
    } else if (number.length <= 7) {
      formatted += ' ' + number.slice(0, 2) + ' ' + number.slice(2, 5) + ' ' + number.slice(5);
    } else {
      formatted += ' ' + number.slice(0, 2) + ' ' + number.slice(2, 5) + ' ' + number.slice(5, 7) + ' ' + number.slice(7, 9);
    }
  } 
  // German format: +49 XXX XXXXXXX
  else if (countryCode === '49' && number.length > 0) {
    if (number.length <= 3) {
      formatted += ' ' + number;
    } else if (number.length <= 7) {
      formatted += ' ' + number.slice(0, 3) + ' ' + number.slice(3);
    } else {
      formatted += ' ' + number.slice(0, 3) + ' ' + number.slice(3, 7) + ' ' + number.slice(7);
    }
  }
  // Default format: groups of 3
  else if (number.length > 0) {
    const parts = number.match(/.{1,3}/g) || [];
    formatted += ' ' + parts.join(' ');
  }
  
  return formatted.trim();
};

const swissCantons = [
  { code: 'ZH', name: 'Zürich' },
  { code: 'BE', name: 'Bern' },
  { code: 'LU', name: 'Luzern' },
  { code: 'UR', name: 'Uri' },
  { code: 'SZ', name: 'Schwyz' },
  { code: 'OW', name: 'Obwalden' },
  { code: 'NW', name: 'Nidwalden' },
  { code: 'GL', name: 'Glarus' },
  { code: 'ZG', name: 'Zug' },
  { code: 'FR', name: 'Freiburg' },
  { code: 'SO', name: 'Solothurn' },
  { code: 'BS', name: 'Basel-Stadt' },
  { code: 'BL', name: 'Basel-Landschaft' },
  { code: 'SH', name: 'Schaffhausen' },
  { code: 'AR', name: 'Appenzell Ausserrhoden' },
  { code: 'AI', name: 'Appenzell Innerrhoden' },
  { code: 'SG', name: 'St. Gallen' },
  { code: 'GR', name: 'Graubünden' },
  { code: 'AG', name: 'Aargau' },
  { code: 'TG', name: 'Thurgau' },
  { code: 'TI', name: 'Tessin' },
  { code: 'VD', name: 'Waadt' },
  { code: 'VS', name: 'Wallis' },
  { code: 'NE', name: 'Neuenburg' },
  { code: 'GE', name: 'Genf' },
  { code: 'JU', name: 'Jura' },
];

// Settings categories for sidebar navigation
type SettingsCategory = 'profile' | 'security' | 'notifications' | 'privacy' | 'api';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [buttonTop, setButtonTop] = useState<number>(0);
  const changedFieldRef = useRef<HTMLElement | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Store original values to detect real changes
  const originalValues = useRef<{
    firstName: string;
    lastName: string;
    currency: string;
    canton: string;
    ocrProvider: string;
    openaiApiKey: string;
    notificationsEnabled: boolean;
    emailNotifications: boolean;
    pushNotifications: boolean;
    reminderNotifications: boolean;
    financeNotifications: boolean;
    chatNotifications: boolean;
    autoBackupEnabled: boolean;
    backupFrequency: string;
    analyticsEnabled: boolean;
    autoConfirmDocuments: boolean;
  }>({
    firstName: '',
    lastName: '',
    currency: 'CHF',
    canton: '',
    ocrProvider: 'google',
    openaiApiKey: '',
    notificationsEnabled: true,
    emailNotifications: true,
    pushNotifications: true,
    reminderNotifications: true,
    financeNotifications: true,
    chatNotifications: true,
    autoBackupEnabled: false,
    backupFrequency: 'daily',
    analyticsEnabled: false,
    autoConfirmDocuments: false,
  });
  const [activeCategory, setActiveCategory] = useState<SettingsCategory>('profile');

  // Form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [showChangeEmailDialog, setShowChangeEmailDialog] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [emailChangePassword, setEmailChangePassword] = useState('');
  const [isChangingEmail, setIsChangingEmail] = useState(false);
  const [language, setLanguage] = useState('de');
  const [currency, setCurrency] = useState('CHF');
  const [canton, setCanton] = useState('');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  
  // Password change dialog
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  
  // Profile picture
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [isUploadingPicture, setIsUploadingPicture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Document Analysis Settings
  const [ocrProvider, setOcrProvider] = useState('google');
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [autoConfirmDocuments, setAutoConfirmDocuments] = useState(false);
  const [isLoadingOcrSettings, setIsLoadingOcrSettings] = useState(true);
  
  // Security & Privacy
  const [activeSessions, setActiveSessions] = useState<Array<{id: string; device: string; location: string; lastActive: Date; current: boolean}>>([]);
  const [loginHistory, setLoginHistory] = useState<Array<{date: Date; device: string; location: string; success: boolean}>>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  const [showDeleteAccountDialog, setShowDeleteAccountDialog] = useState(false);
  const [deleteAccountConfirm, setDeleteAccountConfirm] = useState('');
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isImportingData, setIsImportingData] = useState(false);
  const fileImportInputRef = useRef<HTMLInputElement>(null);
  
  // Phase 3: Advanced Settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(true);
  const [reminderNotifications, setReminderNotifications] = useState(true);
  const [financeNotifications, setFinanceNotifications] = useState(true);
  const [chatNotifications, setChatNotifications] = useState(true);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(false);
  const [backupFrequency, setBackupFrequency] = useState('weekly');
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [dataRetentionDays, setDataRetentionDays] = useState(365);
  
  // 2FA/TOTP
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [twoFactorQRCode, setTwoFactorQRCode] = useState<string | null>(null);
  const [twoFactorVerificationCode, setTwoFactorVerificationCode] = useState('');
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);
  const [isGenerating2FA, setIsGenerating2FA] = useState(false);
  const [QRCodeComponent, setQRCodeComponent] = useState<React.ComponentType<{value: string; size: number}> | null>(null);
  const [show2FATestDialog, setShow2FATestDialog] = useState(false);
  const [twoFactorTestCode, setTwoFactorTestCode] = useState('');
  const [isTesting2FA, setIsTesting2FA] = useState(false);
  const [twoFactorTestResult, setTwoFactorTestResult] = useState<'success' | 'error' | null>(null);
  const [show2FASuccessDialog, setShow2FASuccessDialog] = useState(false);
  const [twoFactorSetupDate, setTwoFactorSetupDate] = useState<Date | null>(null);
  const [twoFactorLastUsed, setTwoFactorLastUsed] = useState<Date | null>(null);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showRegenerateQR, setShowRegenerateQR] = useState(false);
  
  // Passkeys
  const [passkeys, setPasskeys] = useState<Array<{
    id: string;
    deviceName: string;
    deviceType: string;
    backedUp: boolean;
    createdAt: string | null;
    lastUsed: string | null;
  }>>([]);
  const [isLoadingPasskeys, setIsLoadingPasskeys] = useState(false);
  const [showAddPasskeyDialog, setShowAddPasskeyDialog] = useState(false);
  const [newPasskeyName, setNewPasskeyName] = useState('');
  const [isRegisteringPasskey, setIsRegisteringPasskey] = useState(false);
  const [isCleaningPasskeys, setIsCleaningPasskeys] = useState(false);

  // Phone Number & MFA
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [showPhoneDialog, setShowPhoneDialog] = useState(false);
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [phoneVerificationCode, setPhoneVerificationCode] = useState('');
  const [phoneVerificationId, setPhoneVerificationId] = useState<string | null>(null);
  const [isSendingPhoneSMS, setIsSendingPhoneSMS] = useState(false);
  const [isVerifyingPhone, setIsVerifyingPhone] = useState(false);
  const [isRemovingPhone, setIsRemovingPhone] = useState(false);
  const [isEnablingMFA, setIsEnablingMFA] = useState(false);
  const [isDisablingMFA, setIsDisablingMFA] = useState(false);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  
  // Confirmation dialog states
  const [showDeletePasskeyDialog, setShowDeletePasskeyDialog] = useState(false);
  const [passkeyToDelete, setPasskeyToDelete] = useState<string | null>(null);
  const [showRemovePhoneDialog, setShowRemovePhoneDialog] = useState(false);
  const [showDisableMFADialog, setShowDisableMFADialog] = useState(false);
  const [showDisable2FADialog, setShowDisable2FADialog] = useState(false);
  
  const { settings, isLoading: isLoadingUserSettings, updateSettings } = useUserSettings();
  const [isSettingsInitialized, setIsSettingsInitialized] = useState(false);
  
  // Check if there are real changes compared to original values
  // This useEffect runs whenever any tracked value changes
  useEffect(() => {
    // Skip if settings are not yet initialized
    if (!isSettingsInitialized) return;
    
    const hasRealChanges = 
      firstName !== originalValues.current.firstName ||
      lastName !== originalValues.current.lastName ||
      currency !== originalValues.current.currency ||
      canton !== originalValues.current.canton ||
      ocrProvider !== originalValues.current.ocrProvider ||
      openaiApiKey !== originalValues.current.openaiApiKey ||
      notificationsEnabled !== originalValues.current.notificationsEnabled ||
      emailNotifications !== originalValues.current.emailNotifications ||
      pushNotifications !== originalValues.current.pushNotifications ||
      reminderNotifications !== originalValues.current.reminderNotifications ||
      financeNotifications !== originalValues.current.financeNotifications ||
      chatNotifications !== originalValues.current.chatNotifications ||
      autoBackupEnabled !== originalValues.current.autoBackupEnabled ||
      backupFrequency !== originalValues.current.backupFrequency ||
      analyticsEnabled !== originalValues.current.analyticsEnabled ||
      autoConfirmDocuments !== originalValues.current.autoConfirmDocuments;
    
    setHasChanges(hasRealChanges);
  }, [firstName, lastName, currency, canton, ocrProvider, openaiApiKey, 
      notificationsEnabled, emailNotifications, pushNotifications, 
      reminderNotifications, financeNotifications, chatNotifications,
      autoBackupEnabled, backupFrequency, analyticsEnabled, autoConfirmDocuments,
      isSettingsInitialized]);

  // Update button position based on changed field
  const updateButtonPosition = () => {
    if (changedFieldRef.current) {
      const asideElement = document.querySelector('aside.w-40');
      if (asideElement) {
        const fieldRect = changedFieldRef.current.getBoundingClientRect();
        const asideRect = asideElement.getBoundingClientRect();
        // Calculate position relative to the aside element (which is relative positioned)
        const relativeTop = fieldRect.top - asideRect.top;
        setButtonTop(Math.max(0, relativeTop));
      } else {
        // Fallback: calculate relative to main
        const mainElement = changedFieldRef.current.closest('main');
        if (mainElement) {
          const fieldRect = changedFieldRef.current.getBoundingClientRect();
          const mainRect = mainElement.getBoundingClientRect();
          setButtonTop(fieldRect.top - mainRect.top + mainElement.scrollTop);
        }
      }
    }
  };

  // Helper function to handle field changes and update button position
  // Accepts the new value and the field name to compare with original
  const handleFieldChange = (fieldElement: HTMLElement | null, fieldName?: keyof typeof originalValues.current, newValue?: string | boolean) => {
    // Build current values object with the new value
    const currentVals = {
      firstName,
      lastName,
      currency,
      canton,
      ocrProvider,
      openaiApiKey,
      notificationsEnabled,
      emailNotifications,
      pushNotifications,
      reminderNotifications,
      financeNotifications,
      chatNotifications,
      autoBackupEnabled,
      backupFrequency,
      analyticsEnabled,
      autoConfirmDocuments,
    };
    
    // Override with the new value if provided
    if (fieldName && newValue !== undefined) {
      (currentVals as any)[fieldName] = newValue;
    }
    
    // Check if there are real changes
    const hasRealChanges = 
      currentVals.firstName !== originalValues.current.firstName ||
      currentVals.lastName !== originalValues.current.lastName ||
      currentVals.currency !== originalValues.current.currency ||
      currentVals.canton !== originalValues.current.canton ||
      currentVals.ocrProvider !== originalValues.current.ocrProvider ||
      currentVals.openaiApiKey !== originalValues.current.openaiApiKey ||
      currentVals.notificationsEnabled !== originalValues.current.notificationsEnabled ||
      currentVals.emailNotifications !== originalValues.current.emailNotifications ||
      currentVals.pushNotifications !== originalValues.current.pushNotifications ||
      currentVals.reminderNotifications !== originalValues.current.reminderNotifications ||
      currentVals.financeNotifications !== originalValues.current.financeNotifications ||
      currentVals.chatNotifications !== originalValues.current.chatNotifications ||
      currentVals.autoBackupEnabled !== originalValues.current.autoBackupEnabled ||
      currentVals.backupFrequency !== originalValues.current.backupFrequency ||
      currentVals.analyticsEnabled !== originalValues.current.analyticsEnabled ||
      currentVals.autoConfirmDocuments !== originalValues.current.autoConfirmDocuments;

    setHasChanges(hasRealChanges);
    
    if (hasRealChanges && fieldElement) {
      changedFieldRef.current = fieldElement;
      setTimeout(() => updateButtonPosition(), 0);
    }
  };

  // Helper function for Select elements - finds the parent space-y-2 container
  const handleSelectChange = (value: string, setter: (v: string) => void, fieldName: keyof typeof originalValues.current, selectId?: string) => {
    setter(value);
    // Use setTimeout to allow DOM to update after state change
    setTimeout(() => {
      let fieldElement: HTMLElement | null = null;
      if (selectId) {
        const labelElement = document.querySelector(`label[for="${selectId}"]`);
        if (labelElement) {
          fieldElement = labelElement.closest('.space-y-2') as HTMLElement;
        }
        if (!fieldElement) {
          const selectTrigger = document.querySelector(`#${selectId}`);
          if (selectTrigger) {
            fieldElement = selectTrigger.closest('.space-y-2') as HTMLElement;
          }
        }
      }
      if (!fieldElement) {
        const allSelectTriggers = document.querySelectorAll('[role="combobox"]');
        if (allSelectTriggers.length > 0) {
          const lastSelect = allSelectTriggers[allSelectTriggers.length - 1];
          fieldElement = lastSelect.closest('.space-y-2') as HTMLElement;
        }
      }
      handleFieldChange(fieldElement, fieldName, value);
    }, 150);
  };

  // Helper function for Switch elements - finds the parent container
  const handleSwitchChange = (checked: boolean, setter: (v: boolean) => void, fieldName: keyof typeof originalValues.current) => {
    setter(checked);
    // Use setTimeout to allow DOM to update
    setTimeout(() => {
      const switches = document.querySelectorAll('button[role="switch"]');
      let fieldElement: HTMLElement | null = null;
      switches.forEach(switchEl => {
        const parent = switchEl.closest('.flex.items-center.justify-between') || 
                      switchEl.closest('.space-y-2') ||
                      switchEl.closest('.space-y-0.5')?.parentElement;
        if (parent && !fieldElement) {
          fieldElement = parent as HTMLElement;
        }
      });
      handleFieldChange(fieldElement, fieldName, checked);
    }, 50);
  };

  // Update button position on scroll and when field changes
  useEffect(() => {
    if (!hasChanges || !changedFieldRef.current) return;
    
    const mainElement = changedFieldRef.current.closest('main');
    if (!mainElement) return;

    const handleScroll = () => updateButtonPosition();
    mainElement.addEventListener('scroll', handleScroll);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    // Initial position
    updateButtonPosition();
    
    return () => {
      mainElement.removeEventListener('scroll', handleScroll);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [hasChanges, changedFieldRef.current]);
  
  // Load user data
  useEffect(() => {
    if (user) {
      const fullName = user.displayName || '';
      setDisplayName(fullName);
      
      // Split displayName into firstName and lastName
      const nameParts = fullName.trim().split(/\s+/);
      if (nameParts.length > 1) {
        setFirstName(nameParts[0]);
        setLastName(nameParts.slice(1).join(' '));
      } else {
        setFirstName(fullName);
        setLastName('');
      }
      
      setEmail(user.email || '');
      setEmailVerified(user.emailVerified || false);
      setProfilePicture(user.photoURL || null);
      
      // Load OCR settings from Firebase
      const loadOcrSettings = async () => {
        try {
          const getUserSettings = httpsCallable(functions, 'getUserSettings');
          const result: any = await getUserSettings({});
          if (result.data) {
            setOcrProvider(result.data.ocrProvider || 'google');
            setOpenaiApiKey(result.data.openaiApiKey || '');
            setAutoConfirmDocuments(result.data.autoConfirmDocuments || false);
          }
        } catch (error) {
          // Silently fail - settings will use defaults
        } finally {
          setIsLoadingOcrSettings(false);
        }
      };
      loadOcrSettings();
    } else {
      setIsLoadingOcrSettings(false);
    }
  }, [user]);

  // Load settings from Firebase UserSettings with localStorage migration
  useEffect(() => {
    if (!isLoadingUserSettings && settings) {
      // Load firstName and lastName from settings if available
      if (settings.firstName) {
        setFirstName(settings.firstName);
      }
      if (settings.lastName) {
        setLastName(settings.lastName);
      }
      
      // Migrate from localStorage if Firebase settings are not set
      const migratedLanguage = settings.language || localStorage.getItem('nexo-language') || 'de';
      const migratedCurrency = settings.currency || localStorage.getItem('nexo-currency') || 'CHF';
      const migratedCanton = settings.canton || localStorage.getItem('nexo-canton') || '';
      const migratedNotifications = settings.notificationsEnabled !== undefined 
        ? settings.notificationsEnabled 
        : (localStorage.getItem('nexo-notifications') !== 'false');
      const migratedTheme = settings.theme || localStorage.getItem('nexo-theme') || 'light';
      
      // Check if we need to migrate
      const hasLocalData = localStorage.getItem('nexo-language') || 
                          localStorage.getItem('nexo-currency') || 
                          localStorage.getItem('nexo-canton') ||
                          localStorage.getItem('nexo-notifications') ||
                          localStorage.getItem('nexo-theme');
      
      if (hasLocalData && (!settings.language || !settings.currency)) {
        // Migrate to Firebase
        updateSettings({
          language: migratedLanguage,
          currency: migratedCurrency,
          canton: migratedCanton,
          notificationsEnabled: migratedNotifications,
          theme: migratedTheme,
        }).then(() => {
          // Clear localStorage after successful migration
          localStorage.removeItem('nexo-language');
          localStorage.removeItem('nexo-currency');
          localStorage.removeItem('nexo-canton');
          localStorage.removeItem('nexo-notifications');
          localStorage.removeItem('nexo-theme');
        }).catch(console.error);
      }
      
      setLanguage(migratedLanguage);
      setCurrency(migratedCurrency);
      setCanton(migratedCanton);
      setNotificationsEnabled(migratedNotifications);
      setIsDarkMode(migratedTheme === 'dark');
      
      // Phase 3: Load advanced settings
      setEmailNotifications(settings.emailNotifications ?? true);
      setPushNotifications(settings.pushNotifications ?? true);
      setReminderNotifications(settings.reminderNotifications ?? true);
      setFinanceNotifications(settings.financeNotifications ?? true);
      setChatNotifications(settings.chatNotifications ?? true);
      setAutoBackupEnabled(settings.autoBackupEnabled ?? false);
      setBackupFrequency(settings.backupFrequency ?? 'weekly');
      setAnalyticsEnabled(settings.analyticsEnabled ?? true);
      setDataRetentionDays(settings.dataRetentionDays ?? 365);
      
      // Apply theme
      if (migratedTheme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }

    }
  }, [settings, isLoadingUserSettings, updateSettings]);

  // Initialize original values after all settings are loaded
  useEffect(() => {
    if (!isLoadingUserSettings && !isLoadingOcrSettings && settings && !isSettingsInitialized) {
      // Store original values for change detection
      originalValues.current = {
        firstName: firstName,
        lastName: lastName,
        currency: currency,
        canton: canton,
        ocrProvider: ocrProvider,
        openaiApiKey: openaiApiKey,
        notificationsEnabled: notificationsEnabled,
        emailNotifications: emailNotifications,
        pushNotifications: pushNotifications,
        reminderNotifications: reminderNotifications,
        financeNotifications: financeNotifications,
        chatNotifications: chatNotifications,
        autoBackupEnabled: autoBackupEnabled,
        backupFrequency: backupFrequency,
        analyticsEnabled: analyticsEnabled,
        autoConfirmDocuments: autoConfirmDocuments,
      };
      setIsSettingsInitialized(true);
    }
  }, [isLoadingUserSettings, isLoadingOcrSettings, settings, isSettingsInitialized,
      firstName, lastName, currency, canton, ocrProvider, openaiApiKey,
      notificationsEnabled, emailNotifications, pushNotifications,
      reminderNotifications, financeNotifications, chatNotifications,
      autoBackupEnabled, backupFrequency, analyticsEnabled, autoConfirmDocuments]);

  const handleLanguageChange = (value: string) => {
    setLanguage(value);
    i18n.changeLanguage(value);
    updateSettings({ language: value }).catch(console.error);
    // Don't set hasChanges - language is saved automatically
  };

  const handleThemeChange = (dark: boolean) => {
    setIsDarkMode(dark);
    const themeValue = dark ? 'dark' : 'light';
    updateSettings({ theme: themeValue }).catch(console.error);
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Don't set hasChanges - theme is saved automatically
  };

  // Handle profile picture upload
  const handleProfilePictureChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error(t('settings.invalidImageType', 'Nur Bilddateien sind erlaubt'));
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('settings.imageTooLarge', 'Bild ist zu groß (max. 5MB)'));
      return;
    }

    setIsUploadingPicture(true);
    try {
      // Upload to Firebase Storage with metadata
      const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const storageRef = ref(storage, `profile-pictures/${user.uid}/${fileName}`);
      
      // Upload with metadata
      const metadata = {
        contentType: file.type,
        customMetadata: {
          uploadedBy: user.uid,
          uploadedAt: new Date().toISOString(),
        }
      };
      
      await uploadBytes(storageRef, file, metadata);
      const downloadURL = await getDownloadURL(storageRef);

      // Update user profile
      await updateProfile(user, { photoURL: downloadURL });
      setProfilePicture(downloadURL);
      
      toast.success(t('settings.profilePictureUpdated', 'Profilbild erfolgreich aktualisiert'));
    } catch (error: any) {
      console.error('Error uploading profile picture:', error);
      let errorMessage = t('settings.errorUploadingPicture', 'Fehler beim Hochladen des Profilbilds');
      
      if (error.code === 'storage/unauthorized') {
        errorMessage = t('settings.uploadUnauthorized', 'Sie haben keine Berechtigung zum Hochladen');
      } else if (error.code === 'storage/canceled') {
        errorMessage = t('settings.uploadCanceled', 'Upload wurde abgebrochen');
      } else if (error.code === 'storage/unknown') {
        errorMessage = t('settings.uploadUnknownError', 'Unbekannter Fehler beim Upload');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsUploadingPicture(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle send email verification
  const handleSendEmailVerification = async () => {
    if (!user) {
      toast.error(t('settings.userNotLoggedIn', 'Benutzer nicht angemeldet'));
      return;
    }

    if (user.emailVerified) {
      toast.info(t('settings.emailAlreadyVerified', 'E-Mail ist bereits verifiziert'));
      return;
    }

    setIsSendingVerification(true);
    try {
      await sendEmailVerification(user);
      toast.success(t('settings.verificationEmailSent', 'Verifizierungs-E-Mail wurde gesendet. Bitte prüfen Sie Ihren Posteingang.'));
    } catch (error: any) {
      console.error('Error sending verification email:', error);
      let errorMessage = t('settings.errorSendingVerification', 'Fehler beim Senden der Verifizierungs-E-Mail');
      if (error.code === 'auth/too-many-requests') {
        errorMessage = t('auth.login.tooManyRequests', 'Zu viele Anfragen. Bitte warten Sie einige Minuten.');
      }
      toast.error(errorMessage);
    } finally {
      setIsSendingVerification(false);
    }
  };

  // Handle email change
  const handleEmailChange = async () => {
    if (!user || !user.email) {
      toast.error(t('settings.userNotLoggedIn', 'Benutzer nicht angemeldet'));
      return;
    }

    if (!newEmail || !newEmail.includes('@')) {
      toast.error(t('settings.invalidEmail', 'Bitte geben Sie eine gültige E-Mail-Adresse ein'));
      return;
    }

    if (!emailChangePassword) {
      toast.error(t('settings.passwordRequired', 'Passwort ist erforderlich'));
      return;
    }

    setIsChangingEmail(true);
    try {
      // Re-authenticate user first
      const credential = EmailAuthProvider.credential(user.email, emailChangePassword);
      await reauthenticateWithCredential(user, credential);

      // Send verification to new email
      await verifyBeforeUpdateEmail(user, newEmail);
      
      toast.success(t('settings.emailChangeVerificationSent', 'Eine Bestätigungs-E-Mail wurde an die neue Adresse gesendet. Bitte bestätigen Sie diese um die Änderung abzuschließen.'));
      setShowChangeEmailDialog(false);
      setNewEmail('');
      setEmailChangePassword('');
    } catch (error: any) {
      console.error('Error changing email:', error);
      let errorMessage = t('settings.errorChangingEmail', 'Fehler beim Ändern der E-Mail-Adresse');
      if (error.code === 'auth/wrong-password') {
        errorMessage = t('settings.wrongPassword', 'Falsches Passwort');
      } else if (error.code === 'auth/email-already-in-use') {
        errorMessage = t('settings.emailInUse', 'Diese E-Mail-Adresse wird bereits verwendet');
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = t('settings.invalidEmail', 'Ungültige E-Mail-Adresse');
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = t('settings.requiresRecentLogin', 'Bitte melden Sie sich erneut an und versuchen Sie es dann nochmal.');
      }
      toast.error(errorMessage);
    } finally {
      setIsChangingEmail(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async () => {
    if (!user || !user.email) {
      toast.error(t('settings.userNotLoggedIn', 'Benutzer nicht angemeldet'));
      return;
    }

    // Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(t('settings.fillAllFields', 'Bitte füllen Sie alle Felder aus'));
      return;
    }

    if (newPassword.length < 6) {
      toast.error(t('settings.passwordTooShort', 'Passwort muss mindestens 6 Zeichen lang sein'));
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error(t('settings.passwordsDoNotMatch', 'Passwörter stimmen nicht überein'));
      return;
    }

    setIsChangingPassword(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setShowPasswordDialog(false);

      toast.success(t('settings.passwordChanged', 'Passwort erfolgreich geändert'));
    } catch (error: any) {
      console.error('Error changing password:', error);
      let errorMessage = t('settings.errorChangingPassword', 'Fehler beim Ändern des Passworts');
      
      if (error.code === 'auth/wrong-password') {
        errorMessage = t('settings.wrongCurrentPassword', 'Aktuelles Passwort ist falsch');
      } else if (error.code === 'auth/weak-password') {
        errorMessage = t('settings.weakPassword', 'Passwort ist zu schwach');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Load active sessions and login history
  useEffect(() => {
    if (!user) return;

    const loadSecurityData = async () => {
      setIsLoadingSessions(true);
      try {
        // Load login history from Firestore
        const loginHistoryRef = collection(db, 'loginHistory');
        const loginHistoryQuery = query(
          loginHistoryRef,
          where('userId', '==', user.uid),
          orderBy('timestamp', 'desc'),
          limit(20)
        );
        const loginHistorySnapshot = await getDocs(loginHistoryQuery);
        const history = loginHistorySnapshot.docs.map(doc => {
          const data = doc.data();
          return {
            date: data.timestamp?.toDate() || new Date(),
            device: data.device || 'Unknown',
            location: data.location || 'Unknown',
            success: data.success !== false,
          };
        });
        setLoginHistory(history);

        // For active sessions, we'll use a simplified approach
        // In a real app, you'd track this via Cloud Functions
        const getDeviceType = () => {
          if (navigator.userAgent.includes('Mobile')) return 'Mobile';
          if (navigator.userAgent.includes('Tablet')) return 'Tablet';
          return 'Desktop';
        };
        const currentSession = {
          id: 'current',
          device: getDeviceType(),
          location: t('settings.currentDevice', 'Aktuelles Gerät'),
          lastActive: new Date(),
          current: true,
        };
        setActiveSessions([currentSession]);
      } catch (error) {
        console.error('Error loading security data:', error);
      } finally {
        setIsLoadingSessions(false);
      }
    };

    loadSecurityData();
  }, [user]);

  // Log current login to history
  useEffect(() => {
    if (!user) return;

    const logLogin = async () => {
      try {
        // Get device info
        const getDeviceType = () => {
          if (navigator.userAgent.includes('Mobile')) return 'Mobile';
          if (navigator.userAgent.includes('Tablet')) return 'Tablet';
          return 'Desktop';
        };
        const device = getDeviceType();
        
        // Get location (simplified - in production, use IP geolocation)
        const location = 'Unknown'; // Could be enhanced with IP geolocation API

        // Check if login already logged today
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const loginHistoryRef = collection(db, 'loginHistory');
        const todayQuery = query(
          loginHistoryRef,
          where('userId', '==', user.uid),
          where('timestamp', '>=', Timestamp.fromDate(today)),
          limit(1)
        );
        const existing = await getDocs(todayQuery);
        
        if (existing.empty) {
          // Log new login
          await addDoc(loginHistoryRef, {
            userId: user.uid,
            timestamp: Timestamp.now(),
            device,
            location,
            success: true,
          });
        }
      } catch (error) {
        // Silently fail - not critical
        console.error('Error logging login:', error);
      }
    };

    logLogin();
  }, [user]);

  // Handle sign out from other devices
  const handleSignOutOtherDevices = async () => {
    if (!user) return;

    try {
      // This would require a Cloud Function to invalidate tokens
      // For now, we'll show a message
      toast.info(t('settings.signOutOtherDevicesInfo', 'Diese Funktion erfordert eine Cloud Function. Bitte melden Sie sich manuell von anderen Geräten ab.'));
    } catch (error) {
      console.error('Error signing out from other devices:', error);
      toast.error(t('settings.errorSignOutOther', 'Fehler beim Abmelden von anderen Geräten'));
    }
  };

  // Handle data export
  const handleExportData = async () => {
    if (!user) return;

    setIsExportingData(true);
    try {
      // Collect all user data
      const exportData: any = {
        exportDate: new Date().toISOString(),
        userId: user.uid,
        profile: {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
        },
        settings: settings || {},
      };

      // Export reminders
      const remindersRef = collection(db, 'reminders');
      const remindersQuery = query(remindersRef, where('userId', '==', user.uid));
      const remindersSnapshot = await getDocs(remindersQuery);
      exportData.reminders = remindersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Export finance entries
      const financeRef = collection(db, 'financeEntries');
      const financeQuery = query(financeRef, where('userId', '==', user.uid));
      const financeSnapshot = await getDocs(financeQuery);
      exportData.financeEntries = financeSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Export chat conversations
      const chatRef = collection(db, 'chatConversations');
      const chatQuery = query(chatRef, where('userId', '==', user.uid));
      const chatSnapshot = await getDocs(chatQuery);
      exportData.chatConversations = chatSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Create Nexo proprietary file format
      // Format: NEXO_FILE_V1\n{JSON_DATA}
      const nexofileHeader = 'NEXO_FILE_V1';
      const jsonData = JSON.stringify(exportData, null, 2);
      const nexofileContent = `${nexofileHeader}\n${jsonData}`;
      
      // Create blob with custom MIME type
      const dataBlob = new Blob([nexofileContent], { type: 'application/octet-stream' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `nexo-export-${user.uid}-${Date.now()}.nexo`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(t('settings.dataExported', 'Daten erfolgreich exportiert'));
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error(t('settings.errorExportingData', 'Fehler beim Exportieren der Daten'));
    } finally {
      setIsExportingData(false);
    }
  };

  // Handle data import
  const handleImportData = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!user) return;

    const file = event.target.files?.[0];
    if (!file) return;

    // Check file extension
    if (!file.name.endsWith('.nexo')) {
      toast.error(t('settings.invalidFileFormat', 'Ungültiges Dateiformat. Bitte wählen Sie eine .nexo Datei.'));
      return;
    }

    setIsImportingData(true);
    try {
      // Read file content
      const fileContent = await file.text();
      
      // Check for Nexo file header
      if (!fileContent.startsWith('NEXO_FILE_V1\n')) {
        toast.error(t('settings.invalidNexoFile', 'Ungültige Nexo-Datei. Die Datei ist nicht im korrekten Format.'));
        return;
      }

      // Extract JSON data (everything after the header)
      const jsonData = fileContent.substring('NEXO_FILE_V1\n'.length);
      const importData = JSON.parse(jsonData);

      // Validate that this is a Nexo export file
      if (!importData.exportDate || !importData.userId) {
        toast.error(t('settings.invalidNexoFile', 'Ungültige Nexo-Datei. Die Datei ist nicht im korrekten Format.'));
        return;
      }

      // Show import preview/confirmation dialog
      // For now, we'll just show a success message
      // In the future, you could add a dialog to select what to import
      toast.success(t('settings.dataImported', 'Daten erfolgreich importiert. Export-Datum: {{date}}', { 
        date: new Date(importData.exportDate).toLocaleString() 
      }));

      // Clear file input
      if (fileImportInputRef.current) {
        fileImportInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error(t('settings.errorImportingData', 'Fehler beim Importieren der Daten'));
    } finally {
      setIsImportingData(false);
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmText = t('settings.deleteConfirmText', 'LÖSCHEN');
    if (deleteAccountConfirm !== confirmText) {
      toast.error(t('settings.deleteAccountConfirmError', 'Bitte geben Sie "LÖSCHEN" ein, um zu bestätigen').replace('LÖSCHEN', confirmText));
      return;
    }

    setIsDeletingAccount(true);
    try {
      // Delete all user data from Firestore
      // This is a simplified version - in production, use a Cloud Function
      
      // Delete reminders
      const remindersRef = collection(db, 'reminders');
      const remindersQuery = query(remindersRef, where('userId', '==', user.uid));
      const remindersSnapshot = await getDocs(remindersQuery);
      for (const docSnapshot of remindersSnapshot.docs) {
        await deleteDoc(doc(db, 'reminders', docSnapshot.id));
      }

      // Delete finance entries
      const financeRef = collection(db, 'financeEntries');
      const financeQuery = query(financeRef, where('userId', '==', user.uid));
      const financeSnapshot = await getDocs(financeQuery);
      for (const docSnapshot of financeSnapshot.docs) {
        await deleteDoc(doc(db, 'financeEntries', docSnapshot.id));
      }

      // Delete chat conversations
      const chatRef = collection(db, 'chatConversations');
      const chatQuery = query(chatRef, where('userId', '==', user.uid));
      const chatSnapshot = await getDocs(chatQuery);
      for (const docSnapshot of chatSnapshot.docs) {
        await deleteDoc(doc(db, 'chatConversations', docSnapshot.id));
      }

      // Delete user settings
      await deleteDoc(doc(db, 'userSettings', user.uid));

      // Delete user account
      await deleteUser(user);

      toast.success(t('settings.accountDeleted', 'Konto erfolgreich gelöscht'));
      
      // Redirect to login
      window.location.href = '/login';
    } catch (error: any) {
      console.error('Error deleting account:', error);
      let errorMessage = t('settings.errorDeletingAccount', 'Fehler beim Löschen des Kontos');
      
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = t('settings.recentLoginRequired', 'Bitte melden Sie sich erneut an, um das Konto zu löschen');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsDeletingAccount(false);
      setShowDeleteAccountDialog(false);
      setDeleteAccountConfirm('');
    }
  };

  // 2FA/TOTP Functions
  const generate2FASecret = async () => {
    if (isGenerating2FA) {
      console.log('[2FA] Already generating, skipping...');
      return;
    }

    if (!user) {
      toast.error(t('settings.userNotLoggedIn', 'Sie müssen angemeldet sein'));
      setTwoFactorEnabled(false);
      return;
    }

    setIsGenerating2FA(true);
    
    try {
      console.log('[2FA] Starting secret generation...');
      
      // Dynamically import otplib only when needed
      // Use loader that defines exports before importing
      console.log('[2FA] Loading otplib with exports fix...');
      const { loadOtplib } = await import('@/lib/otplib-loader');
      const otplibModule = await loadOtplib();
      console.log('[2FA] Import successful:', otplibModule);
      
      const { authenticator } = otplibModule;
      
      if (!authenticator) {
        throw new Error('Authenticator not found in imported module');
      }
      
      console.log('[2FA] Generating secret...');
      // Generate secret
      const secret = authenticator.generateSecret();
      console.log('[2FA] Secret generated:', secret ? 'Success' : 'Failed');
      
      if (!secret) {
        throw new Error('Failed to generate secret');
      }
      
      setTwoFactorSecret(secret);

      // Generate QR code URL
      const serviceName = 'Nexo';
      const accountName = user.email || user.uid;
      console.log('[2FA] Generating QR code URL for:', accountName);
      const otpAuthUrl = authenticator.keyuri(accountName, serviceName, secret);
      console.log('[2FA] QR code URL generated:', otpAuthUrl ? 'Success' : 'Failed');
      
      if (!otpAuthUrl) {
        throw new Error('Failed to generate QR code URL');
      }
      
      setTwoFactorQRCode(otpAuthUrl);

      // Save secret to Firestore (encrypted in production)
      console.log('[2FA] Saving to Firestore...');
      await setDoc(doc(db, 'twoFactorSecrets', user.uid), {
        secret,
        enabled: false, // Will be enabled after verification
        createdAt: Timestamp.now(),
      });
      console.log('[2FA] Saved to Firestore successfully');

      // Open the setup modal
      console.log('[2FA] Opening setup modal...');
      setShow2FASetup(true);
      console.log('[2FA] Setup complete!');
    } catch (error: any) {
      console.error('[2FA] Error generating 2FA secret:', error);
      console.error('[2FA] Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });
      toast.error(t('settings.errorGenerating2FA', 'Fehler beim Generieren des 2FA-Secrets. Bitte versuchen Sie es erneut.'));
      // Reset toggle if error occurs
      setTwoFactorEnabled(false);
      setTwoFactorSecret(null);
      setTwoFactorQRCode(null);
    } finally {
      setIsGenerating2FA(false);
    }
  };

  const verify2FACode = async () => {
    if (!user || !twoFactorSecret || !twoFactorVerificationCode) return;

    setIsVerifying2FA(true);
    try {
      // Dynamically import otplib only when needed
      const { authenticator } = await import('otplib');
      
      // Verify the code
      const isValid = authenticator.verify({
        token: twoFactorVerificationCode,
        secret: twoFactorSecret,
      });

      if (!isValid) {
        toast.error(t('settings.invalid2FACode', 'Ungültiger Verifizierungscode'));
        return;
      }

      // Enable 2FA
      const setupDate = Timestamp.now();
      await setDoc(doc(db, 'twoFactorSecrets', user.uid), {
        secret: twoFactorSecret,
        enabled: true,
        createdAt: setupDate,
      });

      setTwoFactorEnabled(true);
      setTwoFactorSetupDate(setupDate.toDate());
      setShow2FASetup(false);
      setTwoFactorVerificationCode('');
      
      // Send 2FA activation notification email
      try {
        const send2FAEmail = httpsCallable(functions, 'send2FAActivationEmail');
        await send2FAEmail({
          displayName: user.displayName,
          email: user.email,
          language: i18n.language || 'en',
        });
      } catch (emailError) {
        console.log('[2FA] Email notification failed (non-critical):', emailError);
      }
      
      // Show success dialog
      setShow2FASuccessDialog(true);
      
      toast.success(t('settings.twoFactorEnabled', 'Zwei-Faktor-Authentifizierung aktiviert'));
    } catch (error) {
      console.error('Error verifying 2FA code:', error);
      toast.error(t('settings.errorVerifying2FA', 'Fehler bei der Verifizierung'));
    } finally {
      setIsVerifying2FA(false);
    }
  };

  const disable2FA = async () => {
    if (!user) return;

    try {
      await deleteDoc(doc(db, 'twoFactorSecrets', user.uid));
      setTwoFactorEnabled(false);
      setTwoFactorSecret(null);
      setTwoFactorQRCode(null);
      setTwoFactorSetupDate(null);
      setTwoFactorLastUsed(null);
      setBackupCodes([]);
      
      // Send 2FA deactivation notification email
      try {
        const send2FAEmail = httpsCallable(functions, 'send2FADeactivationEmail');
        await send2FAEmail({
          displayName: user.displayName,
          email: user.email,
          language: i18n.language || 'en',
        });
      } catch (emailError) {
        console.log('[2FA] Email notification failed (non-critical):', emailError);
      }
      
      toast.success(t('settings.twoFactorDisabled', 'Zwei-Faktor-Authentifizierung deaktiviert'));
    } catch (error) {
      console.error('Error disabling 2FA:', error);
      toast.error(t('settings.errorDisabling2FA', 'Fehler beim Deaktivieren der 2FA'));
    }
  };
  
  // Passkey Functions
  const loadPasskeys = async () => {
    if (!user) return;
    
    setIsLoadingPasskeys(true);
    try {
      const listPasskeysFunc = httpsCallable(functions, 'listPasskeys');
      const result = await listPasskeysFunc({});
      const data = result.data as { passkeys: typeof passkeys };
      setPasskeys(data.passkeys || []);
    } catch (error) {
      console.error('Error loading passkeys:', error);
    } finally {
      setIsLoadingPasskeys(false);
    }
  };
  
  const handleAddPasskey = async () => {
    if (!user) return;
    
    setIsRegisteringPasskey(true);
    try {
      const { startRegistration } = await import('@simplewebauthn/browser');
      
      // Get registration options from server
      const generateOptions = httpsCallable(functions, 'generatePasskeyRegistrationOptions');
      const optionsResult = await generateOptions({});
      const options = optionsResult.data as any;
      
      // Start WebAuthn registration
      const credential = await startRegistration({ optionsJSON: options });
      
      // Verify with server
      const verifyRegistration = httpsCallable(functions, 'verifyPasskeyRegistration');
      const verifyResult = await verifyRegistration({ 
        credential, 
        deviceName: newPasskeyName || t('settings.defaultDeviceName', 'Mein Gerät') 
      });
      const data = verifyResult.data as { success: boolean };
      
      if (data.success) {
        toast.success(t('settings.passkeyAdded', 'Passkey erfolgreich hinzugefügt'));
        setShowAddPasskeyDialog(false);
        setNewPasskeyName('');
        await loadPasskeys();
      }
    } catch (error: any) {
      console.error('Error adding passkey:', error);
      
      let errorMessage = t('settings.passkeyAddError', 'Fehler beim Hinzufügen des Passkeys');
      
      if (error.name === 'NotAllowedError') {
        errorMessage = t('settings.passkeyAborted', 'Registrierung abgebrochen');
      } else if (error.name === 'InvalidStateError') {
        errorMessage = t('settings.passkeyAlreadyRegistered', 'Dieser Passkey ist bereits registriert');
      }
      
      toast.error(errorMessage);
    } finally {
      setIsRegisteringPasskey(false);
    }
  };
  
  const handleDeletePasskeyConfirm = async () => {
    if (!passkeyToDelete) return;
    
    try {
      const deletePasskeyFunc = httpsCallable(functions, 'deletePasskey');
      await deletePasskeyFunc({ passkeyId: passkeyToDelete });
      
      toast.success(t('settings.passkeyDeleted', 'Passkey gelöscht'));
      setPasskeys(passkeys.filter(p => p.id !== passkeyToDelete));
    } catch (error) {
      console.error('Error deleting passkey:', error);
      toast.error(t('settings.passkeyDeleteError', 'Fehler beim Löschen des Passkeys'));
    } finally {
      setShowDeletePasskeyDialog(false);
      setPasskeyToDelete(null);
    }
  };
  
  const handleDeletePasskey = (passkeyId: string) => {
    setPasskeyToDelete(passkeyId);
    setShowDeletePasskeyDialog(true);
  };

  // TEMPORARY: Admin cleanup function for corrupted passkeys
  const handleCleanupAllPasskeys = async () => {
    setIsCleaningPasskeys(true);
    try {
      const cleanupFunc = httpsCallable(functions, 'adminDeleteAllPasskeys');
      const result = await cleanupFunc({});
      const data = result.data as { success: boolean; deletedCount: number; message: string };
      
      toast.success(data.message || t('settings.passkeysDeleted', '{{count}} Passkeys gelöscht', { count: data.deletedCount }));
      setPasskeys([]);
      await loadPasskeys();
    } catch (error: any) {
      console.error('Error cleaning passkeys:', error);
      toast.error(t('settings.errorDeletingPasskeys', 'Fehler beim Löschen der Passkeys. Bitte versuchen Sie es erneut.'));
    } finally {
      setIsCleaningPasskeys(false);
    }
  };

  
  // Load passkeys on mount
  useEffect(() => {
    if (user) {
      loadPasskeys();
    }
  }, [user]);

  const test2FA = async () => {
    if (!user || !twoFactorSecret || !twoFactorTestCode) return;

    setIsTesting2FA(true);
    setTwoFactorTestResult(null);
    
    try {
      const { authenticator } = await import('otplib');
      
      const isValid = authenticator.verify({
        token: twoFactorTestCode,
        secret: twoFactorSecret,
      });

      if (isValid) {
        setTwoFactorTestResult('success');
        setTwoFactorLastUsed(new Date());
        // Update last used in Firestore
        await setDoc(doc(db, 'twoFactorSecrets', user.uid), {
          secret: twoFactorSecret,
          enabled: true,
          lastUsed: Timestamp.now(),
        }, { merge: true });
        toast.success(t('settings.twoFactorTestSuccess', '2FA-Test erfolgreich! Ihre Konfiguration funktioniert korrekt.'));
      } else {
        setTwoFactorTestResult('error');
        toast.error(t('settings.twoFactorTestError', 'Ungültiger Code. Bitte versuchen Sie es erneut.'));
      }
    } catch (error) {
      console.error('Error testing 2FA:', error);
      setTwoFactorTestResult('error');
      toast.error(t('settings.errorTesting2FA', 'Fehler beim Testen der 2FA'));
    } finally {
      setIsTesting2FA(false);
    }
  };

  const generateBackupCodes = () => {
    const codes: string[] = [];
    for (let i = 0; i < 10; i++) {
      // Generate 8-digit backup codes
      const code = Math.floor(10000000 + Math.random() * 90000000).toString();
      codes.push(code);
    }
    setBackupCodes(codes);
    setShowBackupCodes(true);
    
    // Save backup codes to Firestore (hashed)
    if (user && twoFactorSecret) {
      // In production, these should be hashed before storing
      setDoc(doc(db, 'twoFactorSecrets', user.uid), {
        secret: twoFactorSecret,
        enabled: true,
        backupCodes: codes,
      }, { merge: true }).catch(console.error);
    }
  };

  const regenerateQRCode = async () => {
    if (!user) return;
    
    try {
      await generate2FASecret();
      setShowRegenerateQR(false);
      toast.success(t('settings.qrCodeRegenerated', 'QR-Code wurde neu generiert. Bitte scannen Sie den neuen Code.'));
    } catch (error) {
      console.error('Error regenerating QR code:', error);
      toast.error(t('settings.errorRegeneratingQR', 'Fehler beim Regenerieren des QR-Codes'));
    }
  };

  // Load 2FA status
  useEffect(() => {
    if (!user) return;

    const load2FAStatus = async () => {
      try {
        const twoFactorDoc = await getDoc(doc(db, 'twoFactorSecrets', user.uid));
        if (twoFactorDoc.exists()) {
          const data = twoFactorDoc.data();
          setTwoFactorEnabled(data.enabled === true);
          if (data.enabled) {
            setTwoFactorSecret(data.secret);
            if (data.createdAt) {
              setTwoFactorSetupDate(data.createdAt.toDate());
            }
            if (data.lastUsed) {
              setTwoFactorLastUsed(data.lastUsed.toDate());
            }
            if (data.backupCodes && Array.isArray(data.backupCodes)) {
              setBackupCodes(data.backupCodes);
            }
          }
        }
      } catch (error) {
        console.error('Error loading 2FA status:', error);
      }
    };

    load2FAStatus();
  }, [user]);

  // Load QRCode component dynamically when 2FA setup dialog opens
  useEffect(() => {
    if (show2FASetup && !QRCodeComponent) {
      import('qrcode.react').then((module) => {
        setQRCodeComponent(module.QRCodeSVG as React.ComponentType<{value: string; size: number}>);
      }).catch((error) => {
        console.error('Error loading QRCode component:', error);
      });
    }
  }, [show2FASetup, QRCodeComponent]);

  // Initialize reCAPTCHA verifier for phone authentication
  useEffect(() => {
    if (!user || recaptchaVerifier) return;
    
    const recaptchaContainerId = 'recaptcha-container-phone';
    // Create a dummy div for reCAPTCHA if it doesn't exist
    if (!document.getElementById(recaptchaContainerId)) {
      const div = document.createElement('div');
      div.id = recaptchaContainerId;
      div.style.display = 'none';
      document.body.appendChild(div);
    }

    try {
      const verifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
        'size': 'invisible',
        'callback': () => {
          console.log('reCAPTCHA solved');
        },
        'expired-callback': () => {
          console.log('reCAPTCHA expired');
          toast.error(t('auth.login.recaptchaExpired', 'reCAPTCHA abgelaufen. Bitte versuchen Sie es erneut.'));
        },
        'error-callback': (error: any) => {
          console.error('reCAPTCHA error:', error);
          toast.error(t('auth.login.recaptchaError', 'reCAPTCHA Fehler. Bitte versuchen Sie es erneut.'));
        }
      });
      
      verifier.render().then((widgetId) => {
        console.log('reCAPTCHA rendered with widget ID:', widgetId);
        setRecaptchaVerifier(verifier);
      }).catch((error) => {
        console.error('Error rendering reCAPTCHA:', error);
      });
    } catch (error) {
      console.error('Error creating RecaptchaVerifier:', error);
    }

    return () => {
      // Cleanup will be handled by React
    };
  }, [user, recaptchaVerifier, t]);

  // Load phone number and MFA status
  useEffect(() => {
    if (!user) return;

    const loadPhoneAndMFA = async () => {
      try {
        // Check if phone provider is linked in Firebase Auth
        const phoneProvider = user.providerData.find(provider => provider.providerId === 'phone');
        
        // Load phone number from user settings
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const firestorePhone = userData.phone || null;
          
          // If Firestore has phone but Auth doesn't, or vice versa - sync them
          if (phoneProvider && !firestorePhone) {
            // Phone exists in Auth but not Firestore - use Auth phone
            setPhoneNumber(phoneProvider.phoneNumber || null);
          } else if (!phoneProvider && firestorePhone) {
            // Phone exists in Firestore but not Auth - clear Firestore
            await setDoc(doc(db, 'users', user.uid), { phone: null }, { merge: true });
            setPhoneNumber(null);
          } else {
            setPhoneNumber(firestorePhone);
          }
        } else if (phoneProvider) {
          // No Firestore doc but phone in Auth
          setPhoneNumber(phoneProvider.phoneNumber || null);
        }

        // Check MFA status
        const enrolledFactors = multiFactor(user).enrolledFactors;
        const hasPhoneFactor = enrolledFactors.some(factor => factor.factorId === PhoneMultiFactorGenerator.FACTOR_ID);
        setMfaEnabled(hasPhoneFactor);
      } catch (error) {
        console.error('Error loading phone and MFA status:', error);
      }
    };

    loadPhoneAndMFA();
  }, [user]);

  // Phone Number & MFA Functions
  const handleAddPhoneNumber = async () => {
    if (!newPhoneNumber.trim()) {
      toast.error(t('settings.phoneNumberRequired', 'Telefonnummer ist erforderlich'));
      return;
    }

    if (!recaptchaVerifier || !user) {
      toast.error(t('auth.login.recaptchaNotReady', 'reCAPTCHA ist nicht bereit. Bitte Seite neu laden.'));
      return;
    }

    setIsSendingPhoneSMS(true);
    try {
      const cleanedPhone = newPhoneNumber.replace(/\s/g, '');
      const formattedPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+${cleanedPhone}`;

      // Check if phone number exists in another account
      const checkPhone = httpsCallable(functions, 'checkPhoneNumberExists');
      const checkResult = await checkPhone({ phoneNumber: formattedPhone });
      
      const resultData = checkResult.data as any;
      if (resultData.exists) {
        // Check if it's the same user's phone
        if (resultData.ownNumber) {
          toast.info(t('settings.phoneAlreadyYours', 'Diese Telefonnummer ist bereits mit Ihrem Konto verknüpft.'));
          setIsSendingPhoneSMS(false);
          return;
        } else {
          toast.error(t('settings.phoneNumberExists', 'Diese Telefonnummer ist bereits bei einem anderen Konto registriert.'));
          setIsSendingPhoneSMS(false);
          return;
        }
      }

      // Check if user already has a phone provider - inform them it will be replaced
      const existingPhoneProvider = user.providerData.find(p => p.providerId === 'phone');
      if (existingPhoneProvider) {
        console.log('User has existing phone provider, will be replaced on verification');
        toast.info(t('settings.phoneWillBeReplaced', 'Die bestehende Telefonnummer wird durch die neue ersetzt.'));
      }

      // Use PhoneAuthProvider to verify phone number for linking (not sign in)
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(formattedPhone, recaptchaVerifier);
      console.log('Verification ID received:', verificationId ? 'yes' : 'no');
      setPhoneVerificationId(verificationId);
      toast.success(t('auth.login.smsSent', 'SMS mit Verifizierungscode wurde gesendet. Der Code ist 5 Minuten gültig.'));
    } catch (error: any) {
      console.error('Error sending phone SMS:', error);
      let errorMessage = t('auth.login.phoneError', 'Fehler beim Senden der SMS');
      if (error.code === 'auth/invalid-phone-number') {
        errorMessage = t('auth.login.invalidPhoneNumber', 'Ungültige Telefonnummer');
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = t('auth.login.tooManyRequests', 'Zu viele Anfragen. Bitte warten Sie einige Minuten, bevor Sie es erneut versuchen.');
      } else if (error.code === 'auth/quota-exceeded') {
        errorMessage = t('auth.login.tooManyRequests', 'Zu viele Anfragen. Bitte warten Sie einige Minuten, bevor Sie es erneut versuchen.');
      }
      toast.error(errorMessage);
    } finally {
      setIsSendingPhoneSMS(false);
    }
  };

  const handleVerifyPhoneNumber = async () => {
    // Clean the verification code - remove spaces and non-digits
    const cleanedCode = phoneVerificationCode.replace(/\D/g, '');
    
    if (!cleanedCode || cleanedCode.length !== 6) {
      toast.error(t('auth.login.invalidVerificationCode', 'Ungültiger Verifizierungscode. Bitte geben Sie den 6-stelligen Code ein.'));
      return;
    }

    if (!phoneVerificationId) {
      toast.error(t('auth.login.noConfirmationResult', 'Bitte senden Sie zuerst eine SMS'));
      return;
    }

    if (!user) {
      toast.error(t('settings.userNotLoggedIn', 'Sie müssen angemeldet sein'));
      return;
    }

    const cleanedPhone = newPhoneNumber.replace(/\s/g, '');
    const formattedPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+${cleanedPhone}`;

    setIsVerifyingPhone(true);
    try {
      // Check if there's already a phone provider linked - unlink it first
      const existingPhoneProvider = user.providerData.find(p => p.providerId === 'phone');
      if (existingPhoneProvider) {
        console.log('Unlinking existing phone provider before adding new one');
        // First remove old phone from phoneNumbers collection
        if (existingPhoneProvider.phoneNumber) {
          try {
            await deleteDoc(doc(db, 'phoneNumbers', existingPhoneProvider.phoneNumber));
          } catch {
            // Ignore if not found
          }
        }
        try {
          await unlink(user, 'phone');
        } catch (unlinkError: any) {
          console.error('Error unlinking existing phone:', unlinkError);
          if (unlinkError.code === 'auth/requires-recent-login') {
            toast.error(t('settings.requiresRecentLogin', 'Bitte melden Sie sich erneut an und versuchen Sie es dann nochmal.'));
            setIsVerifyingPhone(false);
            return;
          }
          // Continue if it's just "no such provider" error
          if (unlinkError.code !== 'auth/no-such-provider') {
            throw unlinkError;
          }
        }
      }

      // Create phone credential from verification ID and cleaned code
      console.log('Verifying with cleaned code:', cleanedCode, 'length:', cleanedCode.length);
      console.log('Verification ID exists:', !!phoneVerificationId);
      const credential = PhoneAuthProvider.credential(phoneVerificationId, cleanedCode);
      
      // Link phone number to existing user account (this won't create a new account)
      await linkWithCredential(user, credential);
      
      // Save phone number to Firestore
      await setDoc(doc(db, 'users', user.uid), {
        phone: formattedPhone,
      }, { merge: true });

      await setDoc(doc(db, 'phoneNumbers', formattedPhone), {
        userId: user.uid,
        phoneNumber: formattedPhone,
        createdAt: new Date(),
      }, { merge: true });

      setPhoneNumber(formattedPhone);
      setShowPhoneDialog(false);
      setNewPhoneNumber('');
      setPhoneVerificationCode('');
      setPhoneVerificationId(null);
      toast.success(t('settings.phoneNumberAdded', 'Telefonnummer erfolgreich hinzugefügt'));
    } catch (error: any) {
      console.error('Error verifying phone:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = t('settings.verificationFailed', 'Verifizierung fehlgeschlagen. Bitte versuchen Sie es erneut.');
      
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = t('auth.login.invalidVerificationCode', 'Ungültiger Verifizierungscode. Bitte überprüfen Sie den Code und versuchen Sie es erneut.');
      } else if (error.code === 'auth/code-expired') {
        errorMessage = t('auth.login.codeExpired', 'Code abgelaufen. Bitte fordern Sie eine neue SMS an.');
        // Reset verification state so user can request new code
        setPhoneVerificationId(null);
        setPhoneVerificationCode('');
      } else if (error.code === 'auth/session-expired') {
        errorMessage = t('auth.login.sessionExpired', 'Sitzung abgelaufen. Bitte fordern Sie eine neue SMS an.');
        setPhoneVerificationId(null);
        setPhoneVerificationCode('');
      } else if (error.code === 'auth/phone-number-already-exists' || error.code === 'auth/credential-already-in-use') {
        errorMessage = t('settings.phoneNumberExists', 'Diese Telefonnummer ist bereits bei einem anderen Konto registriert.');
      } else if (error.code === 'auth/provider-already-linked') {
        // This shouldn't happen now since we unlink first, but handle it anyway
        errorMessage = t('settings.phoneAlreadyLinked', 'Eine Telefonnummer ist bereits mit diesem Konto verknüpft. Bitte entfernen Sie diese zuerst.');
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = t('settings.requiresRecentLogin', 'Bitte melden Sie sich erneut an und versuchen Sie es dann nochmal.');
      } else if (error.code) {
        // Show the actual error code for debugging
        errorMessage = `Fehler: ${error.code}`;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsVerifyingPhone(false);
    }
  };

  const handleRemovePhoneNumberConfirm = async () => {
    if (!phoneNumber) return;

    setIsRemovingPhone(true);
    try {
      // Remove from Firebase Auth if it's enrolled as MFA
      if (mfaEnabled) {
        const enrolledFactors = multiFactor(user!).enrolledFactors;
        const phoneFactor = enrolledFactors.find(factor => factor.factorId === PhoneMultiFactorGenerator.FACTOR_ID);
        if (phoneFactor) {
          await multiFactor(user!).unenroll(phoneFactor);
          setMfaEnabled(false);
        }
      }

      // Unlink phone provider from Firebase Auth
      const hasPhoneProvider = user!.providerData.some(provider => provider.providerId === 'phone');
      if (hasPhoneProvider) {
        await unlink(user!, 'phone');
      }

      // Remove from Firestore
      const cleanedPhone = phoneNumber.replace(/\s/g, '');
      await setDoc(doc(db, 'users', user!.uid), {
        phone: null,
      }, { merge: true });

      // Try to delete from phoneNumbers collection (may fail if document doesn't exist)
      try {
        await deleteDoc(doc(db, 'phoneNumbers', cleanedPhone));
      } catch (deleteError) {
        // Document might not exist or have different format, try without + prefix
        const phoneWithoutPlus = cleanedPhone.replace(/^\+/, '');
        try {
          await deleteDoc(doc(db, 'phoneNumbers', phoneWithoutPlus));
        } catch {
          // Ignore - document might not exist
          console.log('Phone number document not found in phoneNumbers collection');
        }
      }

      setPhoneNumber(null);
      toast.success(t('settings.phoneNumberRemoved', 'Telefonnummer erfolgreich entfernt'));
    } catch (error: any) {
      console.error('Error removing phone number:', error);
      let errorMessage = t('settings.errorRemovingPhone', 'Fehler beim Entfernen der Telefonnummer');
      
      if (error.code === 'auth/requires-recent-login') {
        errorMessage = t('settings.requiresRecentLogin', 'Bitte melden Sie sich erneut an und versuchen Sie es dann nochmal.');
      } else if (error.code === 'auth/no-such-provider') {
        // Phone provider not linked, just update Firestore
        const cleanedPhone = phoneNumber.replace(/\s/g, '');
        await setDoc(doc(db, 'users', user!.uid), {
          phone: null,
        }, { merge: true });
        try {
          await deleteDoc(doc(db, 'phoneNumbers', cleanedPhone));
        } catch {
          // Ignore
        }
        setPhoneNumber(null);
        toast.success(t('settings.phoneNumberRemoved', 'Telefonnummer erfolgreich entfernt'));
        setIsRemovingPhone(false);
        setShowRemovePhoneDialog(false);
        return;
      }
      
      toast.error(errorMessage);
    } finally {
      setIsRemovingPhone(false);
      setShowRemovePhoneDialog(false);
    }
  };

  const handleRemovePhoneNumber = () => {
    setShowRemovePhoneDialog(true);
  };

  const handleEnableMFA = async () => {
    if (!phoneNumber) {
      toast.error(t('settings.phoneNumberRequiredForMFA', 'Bitte fügen Sie zuerst eine Telefonnummer hinzu'));
      return;
    }

    if (!recaptchaVerifier) {
      toast.error(t('auth.login.recaptchaNotReady', 'reCAPTCHA ist nicht bereit. Bitte Seite neu laden.'));
      return;
    }

    setIsEnablingMFA(true);
    try {
      const cleanedPhone = phoneNumber.replace(/\s/g, '');
      const formattedPhone = cleanedPhone.startsWith('+') ? cleanedPhone : `+${cleanedPhone}`;

      // Enroll phone number as MFA factor
      const phoneAuthProvider = new PhoneAuthProvider(auth);
      const session = await multiFactor(user!).getSession();
      const verificationId = await phoneAuthProvider.verifyPhoneNumber(
        { phoneNumber: formattedPhone, session },
        recaptchaVerifier
      );

      // Store verification ID temporarily (in a real app, you'd show a dialog for code entry)
      // For now, we'll use a simple prompt
      const code = prompt(t('settings.enterMFACode', 'Geben Sie den 6-stelligen Code ein, den Sie per SMS erhalten haben'));
      if (!code || code.length !== 6) {
        toast.error(t('auth.login.invalidVerificationCode', 'Ungültiger Verifizierungscode'));
        setIsEnablingMFA(false);
        return;
      }

      const credential = PhoneAuthProvider.credential(verificationId, code);
      const multiFactorAssertion = PhoneMultiFactorGenerator.assertion(credential);
      await multiFactor(user!).enroll(multiFactorAssertion, 'Phone Number');

      setMfaEnabled(true);
      toast.success(t('settings.mfaEnabled', 'Multi-Faktor-Authentifizierung erfolgreich aktiviert'));
    } catch (error: any) {
      console.error('Error enabling MFA:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      let errorMessage = t('settings.errorEnablingMFA', 'Fehler beim Aktivieren der MFA');
      if (error.code === 'auth/invalid-verification-code') {
        errorMessage = t('auth.login.invalidVerificationCode', 'Ungültiger Verifizierungscode');
      } else if (error.code === 'auth/requires-recent-login') {
        errorMessage = t('settings.requiresRecentLogin', 'Bitte melden Sie sich erneut an und versuchen Sie es dann nochmal.');
      } else if (error.code === 'auth/second-factor-already-in-use') {
        errorMessage = t('settings.mfaAlreadyEnabled', 'Diese Telefonnummer wird bereits als MFA verwendet.');
      } else if (error.code === 'auth/maximum-second-factor-count-exceeded') {
        errorMessage = t('settings.maxMfaExceeded', 'Maximale Anzahl an MFA-Faktoren erreicht.');
      } else if (error.code === 'auth/unsupported-first-factor') {
        errorMessage = t('settings.unsupportedFirstFactor', 'MFA wird für diese Anmeldemethode nicht unterstützt.');
      } else if (error.code) {
        // Show actual error code for debugging
        errorMessage = `Fehler: ${error.code}`;
      }
      toast.error(errorMessage);
    } finally {
      setIsEnablingMFA(false);
    }
  };

  const handleDisableMFAConfirm = async () => {
    setIsDisablingMFA(true);
    try {
      const enrolledFactors = multiFactor(user!).enrolledFactors;
      const phoneFactor = enrolledFactors.find(factor => factor.factorId === PhoneMultiFactorGenerator.FACTOR_ID);
      if (phoneFactor) {
        await multiFactor(user!).unenroll(phoneFactor);
        setMfaEnabled(false);
        toast.success(t('settings.mfaDisabled', 'Multi-Faktor-Authentifizierung erfolgreich deaktiviert'));
      }
    } catch (error: any) {
      console.error('Error disabling MFA:', error);
      toast.error(t('settings.errorDisablingMFA', 'Fehler beim Deaktivieren der MFA'));
    } finally {
      setIsDisablingMFA(false);
      setShowDisableMFADialog(false);
    }
  };

  const handleDisableMFA = () => {
    setShowDisableMFADialog(true);
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    try {
      // Update display name from firstName and lastName
      const newDisplayName = `${firstName} ${lastName}`.trim();
      if (user && newDisplayName !== displayName) {
        await updateProfile(user, { displayName: newDisplayName });
        setDisplayName(newDisplayName);
      }

      // Save to Firebase UserSettings
      await updateSettings({
        firstName,
        lastName,
        language,
        currency,
        canton,
        notificationsEnabled,
        emailNotifications,
        pushNotifications,
        reminderNotifications,
        financeNotifications,
        chatNotifications,
        autoBackupEnabled,
        backupFrequency,
        analyticsEnabled,
        dataRetentionDays,
      });
      
      // Save to Firebase if user is logged in (legacy function, can be removed later)
      if (user) {
        try {
          const updatePreferences = httpsCallable(functions, 'updateUserPreferences');
          await updatePreferences({
            locale: language,
            defaultCurrency: currency,
            canton: canton,
          });
          
          // Save OCR settings
          const updateUserSettings = httpsCallable(functions, 'updateUserSettings');
          await updateUserSettings({
            ocrProvider,
            openaiApiKey: ocrProvider === 'openai' ? openaiApiKey : null,
            autoConfirmDocuments,
          });
        } catch (firebaseError) {
          // Continue even if Firebase save fails - local storage is saved
        }
      }
      
      // Update original values after successful save
      originalValues.current = {
        firstName,
        lastName,
        currency,
        canton,
        ocrProvider,
        openaiApiKey,
        notificationsEnabled,
        emailNotifications,
        pushNotifications,
        reminderNotifications,
        financeNotifications,
        chatNotifications,
        autoBackupEnabled,
        backupFrequency,
        analyticsEnabled,
        autoConfirmDocuments,
      };
      
      // Reset hasChanges after successful save
      setHasChanges(false);
      changedFieldRef.current = null;
      
      toast.success(t('settings.saved', 'Einstellungen gespeichert'));
    } catch (error) {
      toast.error(t('settings.errorSaving', 'Fehler beim Speichern'));
    } finally {
      setIsSaving(false);
    }
  };

  // Sidebar navigation items
  const sidebarItems: { id: SettingsCategory; icon: React.ReactNode; label: string }[] = [
    { id: 'profile', icon: <User className="w-4 h-4" />, label: t('settings.profile', 'Profil') },
    { id: 'security', icon: <Shield className="w-4 h-4" />, label: t('settings.security', 'Sicherheit') },
    { id: 'notifications', icon: <Bell className="w-4 h-4" />, label: t('settings.notifications', 'Benachrichtigungen') },
    { id: 'privacy', icon: <Lock className="w-4 h-4" />, label: t('settings.privacy', 'Datenschutz') },
    { id: 'api', icon: <Key className="w-4 h-4" />, label: t('settings.api', 'API') },
  ];

  return (
    <Layout title={t('settings.title')}>
      <div className="flex gap-6 max-w-6xl mx-auto">
        {/* Sidebar Navigation */}
        <aside className="w-56 shrink-0 hidden md:block">
          <nav className="sticky top-4 space-y-1">
            {sidebarItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveCategory(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === item.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile Category Selector */}
        <div className="md:hidden w-full mb-4">
          <Select value={activeCategory} onValueChange={(value) => setActiveCategory(value as SettingsCategory)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sidebarItems.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  <div className="flex items-center gap-2">
                    {item.icon}
                    {item.label}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Content Area */}
        <main className="flex-1 min-w-0 space-y-6">
          
          {/* Profile Settings */}
          {activeCategory === 'profile' && (
          <>
          <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <User className="w-5 h-5 text-muted-foreground" />
              <CardTitle>{t('settings.profile', 'Profil')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.profileDescription', 'Verwalten Sie Ihre persönlichen Informationen')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Profile Picture */}
            <div className="space-y-2">
              <Label>{t('settings.profilePicture', 'Profilbild')}</Label>
              <div className="flex items-center gap-4">
                <div className="relative">
                  {profilePicture ? (
                    <img 
                      src={profilePicture} 
                      alt={t('settings.profilePictureAlt', 'Profile')} 
                      className="w-20 h-20 rounded-full object-cover border-2 border-border"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                      <User className="w-10 h-10 text-muted-foreground" />
                    </div>
                  )}
                  {isUploadingPicture && (
                    <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPicture}
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    {t('settings.changePicture', 'Bild ändern')}
                  </Button>
                  {profilePicture && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        if (user) {
                          try {
                            await updateProfile(user, { photoURL: null });
                            setProfilePicture(null);
                            toast.success(t('settings.profilePictureRemoved', 'Profilbild entfernt'));
                          } catch (error) {
                            toast.error(t('settings.errorRemovingPicture', 'Fehler beim Entfernen des Profilbilds'));
                          }
                        }
                      }}
                    >
                      <X className="w-4 h-4 mr-2" />
                      {t('settings.removePicture', 'Entfernen')}
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleProfilePictureChange}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* First Name */}
            <div className="space-y-2">
              <Label htmlFor="firstName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('settings.firstName', 'Vorname')}
              </Label>
              <Input 
                id="firstName" 
                value={firstName}
                onChange={(e) => { 
                  const newValue = e.target.value;
                  setFirstName(newValue);
                  handleFieldChange(e.target.closest('.space-y-2') as HTMLElement, 'firstName', newValue);
                }}
                placeholder={t('settings.firstNamePlaceholder', 'Ihr Vorname')}
              />
            </div>

            {/* Last Name */}
            <div className="space-y-2">
              <Label htmlFor="lastName" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                {t('settings.lastName', 'Nachname')}
              </Label>
              <Input 
                id="lastName" 
                value={lastName}
                onChange={(e) => { 
                  const newValue = e.target.value;
                  setLastName(newValue);
                  handleFieldChange(e.target.closest('.space-y-2') as HTMLElement, 'lastName', newValue);
                }}
                placeholder={t('settings.lastNamePlaceholder', 'Ihr Nachname')}
              />
            </div>

            <Separator />

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email" className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                {t('settings.email', 'E-Mail')}
              </Label>
              <div className="flex gap-2">
                <Input 
                  id="email" 
                  type="email" 
                  value={email}
                  disabled
                  className="bg-muted flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChangeEmailDialog(true)}
                >
                  {t('settings.changeEmail', 'Ändern')}
                </Button>
              </div>
              
              {/* Email Verification Status */}
              {emailVerified ? (
                <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  {t('settings.emailVerified', 'E-Mail verifiziert')}
                </div>
              ) : (
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <div className="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle className="w-3 h-3" />
                    {t('settings.emailNotVerified', 'E-Mail nicht verifiziert')}
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSendEmailVerification}
                    disabled={isSendingVerification}
                    className="text-xs h-7"
                  >
                    {isSendingVerification ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : null}
                    {t('settings.resendVerification', 'Erneut senden')}
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Password Change */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Lock className="w-4 h-4" />
                {t('settings.password', 'Passwort')}
              </Label>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPasswordDialog(true)}
              >
                {t('settings.changePassword', 'Passwort ändern')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Preferences */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <CardTitle>{t('settings.preferences', 'Präferenzen')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.preferencesDescription', 'Passen Sie Ihre App-Einstellungen an')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Language */}
            <div className="space-y-2">
              <Label htmlFor="language" className="flex items-center gap-2">
                <Globe className="w-4 h-4" />
                {t('settings.language', 'Sprache')}
              </Label>
              <Select value={language} onValueChange={handleLanguageChange}>
                <SelectTrigger id="language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="de">{t('settings.german', 'Deutsch')}</SelectItem>
                  <SelectItem value="en">{t('settings.english', 'English')}</SelectItem>
                  <SelectItem value="es">{t('settings.spanish', 'Español')}</SelectItem>
                  <SelectItem value="nl">{t('settings.dutch', 'Nederlands')}</SelectItem>
                  <SelectItem value="it">{t('settings.italian', 'Italiano')}</SelectItem>
                  <SelectItem value="fr">{t('settings.french', 'Français')}</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Currency */}
            <div className="space-y-2">
              <Label htmlFor="currency" className="flex items-center gap-2">
                <Wallet className="w-4 h-4" />
                {t('settings.currency', 'Währung')}
              </Label>
              <Select value={currency} onValueChange={(v) => handleSelectChange(v, setCurrency, 'currency', 'currency')}>
                <SelectTrigger id="currency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CHF">CHF ({t('settings.swissFranc', 'Schweizer Franken')})</SelectItem>
                  <SelectItem value="EUR">EUR ({t('settings.euro', 'Euro')})</SelectItem>
                  <SelectItem value="USD">USD ({t('settings.usDollar', 'US Dollar')})</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Canton */}
            <div className="space-y-2">
              <Label htmlFor="canton" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                {t('settings.canton', 'Kanton')}
              </Label>
              <Select value={canton} onValueChange={(v) => handleSelectChange(v, setCanton, 'canton', 'canton')}>
                <SelectTrigger id="canton">
                  <SelectValue placeholder={t('settings.selectCanton', 'Wählen Sie Ihren Kanton')} />
                </SelectTrigger>
                <SelectContent>
                  {swissCantons.map((c) => (
                    <SelectItem key={c.code} value={c.code}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                {t('settings.cantonHint', 'Wird für Steuerberechnungen verwendet')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Document Analysis Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileSearch className="w-5 h-5 text-muted-foreground" />
              <CardTitle>{t('settings.documentAnalysis', 'Dokumenten-Analyse')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.documentAnalysisDescription', 'Einstellungen für die automatische Dokumentenerkennung')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {isLoadingOcrSettings ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <>
                {/* OCR Provider */}
                <div className="space-y-2">
                  <Label>{t('settings.ocrProvider', 'Analyse-Methode')}</Label>
                  <Select value={ocrProvider} onValueChange={(v) => handleSelectChange(v, setOcrProvider, 'ocrProvider')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="google">{t('settings.ocrProviderGoogle', 'Google Cloud Vision (empfohlen)')}</SelectItem>
                      <SelectItem value="openai">{t('settings.ocrProviderOpenAI', 'OpenAI GPT-4 Vision')}</SelectItem>
                      <SelectItem value="regex">{t('settings.ocrProviderRegex', 'Einfache Texterkennung (kostenlos)')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {ocrProvider === 'google' && t('settings.ocrProviderGoogleDescription', 'Google Cloud Vision - Kostenlos bis 1000 Anfragen/Monat, sehr genau')}
                    {ocrProvider === 'openai' && t('settings.ocrProviderOpenAIDescription', 'OpenAI GPT-4 Vision - Kostenpflichtig, höchste Genauigkeit')}
                    {ocrProvider === 'regex' && t('settings.ocrProviderRegexDescription', 'Einfache Mustererkennung - Kostenlos, weniger genau (nur für Text-PDFs)')}
                  </p>
                </div>

                {/* OpenAI API Key */}
                {ocrProvider === 'openai' && (
                  <div className="space-y-2">
                    <Label htmlFor="openaiKey">{t('settings.openaiApiKey', 'OpenAI API Key')}</Label>
                    <div className="relative">
                      <Input
                        id="openaiKey"
                        type={showApiKey ? 'text' : 'password'}
                        value={openaiApiKey}
onChange={(e) => { 
                          setOpenaiApiKey(e.target.value);
                          handleFieldChange(e.target.closest('.space-y-2') as HTMLElement);
                        }}
                        placeholder="sk-..."
                        className="pr-10"
                      />
                      <button
                        type="button"
                        onClick={() => setShowApiKey(!showApiKey)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t('settings.openaiApiKeyHint', 'API Key von platform.openai.com - Wird verschlüsselt gespeichert')}
                    </p>
                  </div>
                )}

                <Separator />

                {/* Auto-Confirm */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>{t('settings.autoConfirm', 'Automatische Bestätigung')}</Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.autoConfirmHint', 'Erkannte Daten automatisch übernehmen ohne Bestätigung')}
                    </p>
                  </div>
                  <Switch
                    checked={autoConfirmDocuments}
                    onCheckedChange={(v) => handleSwitchChange(v, setAutoConfirmDocuments, 'autoConfirmDocuments')}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              {isDarkMode ? <Moon className="w-5 h-5 text-muted-foreground" /> : <Sun className="w-5 h-5 text-muted-foreground" />}
              <CardTitle>{t('settings.appearance', 'Darstellung')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.appearanceDescription', 'Passen Sie das Erscheinungsbild der App an')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Moon className="w-4 h-4" />
                  {t('settings.darkMode', 'Dunkler Modus')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.darkModeDescription', 'Dunkles Farbschema aktivieren')}
                </p>
              </div>
              <Switch
                checked={isDarkMode}
                onCheckedChange={handleThemeChange}
              />
            </div>
          </CardContent>
        </Card>
          </>
          )}

          {/* Notifications */}
          {activeCategory === 'notifications' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <CardTitle>{t('settings.notifications', 'Benachrichtigungen')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.notificationsDescription', 'Verwalten Sie Ihre Benachrichtigungseinstellungen')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Enable Notifications */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Bell className="w-4 h-4" />
                  {t('settings.enableNotifications', 'Benachrichtigungen aktivieren')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.notificationsHint', 'Erhalten Sie Erinnerungen für anstehende Termine und Zahlungen')}
                </p>
              </div>
              <Switch
                checked={notificationsEnabled}
                onCheckedChange={(v) => handleSwitchChange(v, setNotificationsEnabled, 'notificationsEnabled')}
              />
            </div>

            {notificationsEnabled && (
              <>
                <Separator />
                
                {/* Email Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {t('settings.emailNotifications', 'E-Mail-Benachrichtigungen')}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.emailNotificationsHint', 'Erhalten Sie wichtige Updates per E-Mail')}
                    </p>
                  </div>
                  <Switch
                    checked={emailNotifications}
                    onCheckedChange={(v) => handleSwitchChange(v, setEmailNotifications, 'emailNotifications')}
                    disabled={!notificationsEnabled}
                  />
                </div>

                {/* Push Notifications */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="flex items-center gap-2">
                      <Bell className="w-4 h-4" />
                      {t('settings.pushNotifications', 'Push-Benachrichtigungen')}
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      {t('settings.pushNotificationsHint', 'Erhalten Sie sofortige Benachrichtigungen im Browser')}
                    </p>
                  </div>
                  <Switch
                    checked={pushNotifications}
                    onCheckedChange={(v) => handleSwitchChange(v, setPushNotifications, 'pushNotifications')}
                    disabled={!notificationsEnabled}
                  />
                </div>

                <Separator />

                {/* Notification Types */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">
                    {t('settings.notificationTypes', 'Benachrichtigungstypen')}
                  </Label>
                  
                  {/* Reminder Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('settings.reminderNotifications', 'Erinnerungen')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.reminderNotificationsHint', 'Benachrichtigungen für anstehende Termine')}
                      </p>
                    </div>
                    <Switch
                      checked={reminderNotifications}
                      onCheckedChange={(v) => handleSwitchChange(v, setReminderNotifications, 'reminderNotifications')}
                      disabled={!notificationsEnabled}
                    />
                  </div>

                  {/* Finance Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('settings.financeNotifications', 'Finanzen')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.financeNotificationsHint', 'Benachrichtigungen für Zahlungen und Budgets')}
                      </p>
                    </div>
                    <Switch
                      checked={financeNotifications}
                      onCheckedChange={(v) => handleSwitchChange(v, setFinanceNotifications, 'financeNotifications')}
                      disabled={!notificationsEnabled}
                    />
                  </div>

                  {/* Chat Notifications */}
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>{t('settings.chatNotifications', 'Chat')}</Label>
                      <p className="text-sm text-muted-foreground">
                        {t('settings.chatNotificationsHint', 'Benachrichtigungen für neue Chat-Nachrichten')}
                      </p>
                    </div>
                    <Switch
                      checked={chatNotifications}
                      onCheckedChange={(v) => handleSwitchChange(v, setChatNotifications, 'chatNotifications')}
                      disabled={!notificationsEnabled}
                    />
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
          )}

          {/* Security Section */}
          {activeCategory === 'security' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <CardTitle>{t('settings.security', 'Sicherheit')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.securityDescription', 'Verwalten Sie Ihre Sicherheitseinstellungen und aktive Sitzungen')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Active Sessions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Monitor className="w-4 h-4" />
                  {t('settings.activeSessions', 'Aktive Sitzungen')}
                </Label>
                {activeSessions.length > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSignOutOtherDevices}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('settings.signOutOtherDevices', 'Von anderen Geräten abmelden')}
                  </Button>
                )}
              </div>
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2">
                  {activeSessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        {session.device === 'Mobile' ? (
                          <Smartphone className="w-5 h-5 text-muted-foreground" />
                        ) : session.device === 'Tablet' ? (
                          <Tablet className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <Monitor className="w-5 h-5 text-muted-foreground" />
                        )}
                        <div>
                          <p className="text-sm font-medium">
                            {session.device === 'Mobile' ? t('settings.deviceTypes.mobile') :
                             session.device === 'Tablet' ? t('settings.deviceTypes.tablet') :
                             t('settings.deviceTypes.desktop')}
                          </p>
                          <p className="text-xs text-muted-foreground">{session.location}</p>
                          <p className="text-xs text-muted-foreground">
                            {t('settings.lastActive', 'Zuletzt aktiv')}: {session.lastActive.toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {session.current && (
                        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                          {t('settings.currentDevice', 'Aktuelles Gerät')}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Login History */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <History className="w-4 h-4" />
                {t('settings.loginHistory', 'Login-Verlauf')}
              </Label>
              {isLoadingSessions ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {loginHistory.length === 0 ? (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      {t('settings.noLoginHistory', 'Kein Login-Verlauf verfügbar')}
                    </p>
                  ) : (
                    loginHistory.map((login, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          {login.device === 'Mobile' ? (
                            <Smartphone className="w-4 h-4 text-muted-foreground" />
                          ) : login.device === 'Tablet' ? (
                            <Tablet className="w-4 h-4 text-muted-foreground" />
                          ) : (
                            <Monitor className="w-4 h-4 text-muted-foreground" />
                          )}
                          <div>
                            <p className="text-sm font-medium">
                              {login.device === 'Mobile' ? t('settings.deviceTypes.mobile') :
                               login.device === 'Tablet' ? t('settings.deviceTypes.tablet') :
                               t('settings.deviceTypes.desktop')}
                            </p>
                            <p className="text-xs text-muted-foreground">{login.location}</p>
                            <p className="text-xs text-muted-foreground">
                              {login.date.toLocaleString()}
                            </p>
                          </div>
                        </div>
                        {login.success ? (
                          <span className="text-xs text-green-600">✓</span>
                        ) : (
                          <span className="text-xs text-red-600">✗</span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            <Separator />

            {/* Two-Factor Authentication */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="flex items-center gap-2">
                    <SmartphoneIcon className="w-4 h-4" />
                    {t('settings.twoFactorAuth', 'Zwei-Faktor-Authentifizierung')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.twoFactorAuthHint', 'Schützen Sie Ihr Konto mit einer Authenticator-App')}
                  </p>
                </div>
                <Switch
                  checked={twoFactorEnabled}
                  disabled={isGenerating2FA}
                  onCheckedChange={async (checked) => {
                    console.log('[2FA Toggle] Changed to:', checked, 'isGenerating2FA:', isGenerating2FA);
                    if (isGenerating2FA) {
                      console.log('[2FA Toggle] Already generating, ignoring...');
                      return;
                    }
                    try {
                      if (checked) {
                        // Generate secret and open modal
                        console.log('[2FA Toggle] Calling generate2FASecret...');
                        await generate2FASecret();
                        console.log('[2FA Toggle] generate2FASecret completed');
                      } else {
                        // Disable 2FA - show dialog
                        setShowDisable2FADialog(true);
                      }
                    } catch (error) {
                      console.error('[2FA Toggle] Error:', error);
                      // Reset toggle on error
                      setTwoFactorEnabled(false);
                    }
                  }}
                />
              </div>

              {twoFactorEnabled && (
                <div className="space-y-3">
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        <p className="text-sm font-medium text-green-600 dark:text-green-400">
                          {t('settings.twoFactorEnabled', 'Zwei-Faktor-Authentifizierung ist aktiviert')}
                        </p>
                      </div>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => setShowDisable2FADialog(true)}
                        className="flex items-center gap-2"
                      >
                        <X className="w-4 h-4" />
                        {t('settings.disable2FA', '2FA deaktivieren')}
                      </Button>
                    </div>
                    <div className="space-y-1 text-xs text-muted-foreground">
                      {twoFactorSetupDate && (
                        <p>
                          {t('settings.setupDate', 'Eingerichtet am')}: {twoFactorSetupDate.toLocaleDateString(i18n.language, { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                      {twoFactorLastUsed && (
                        <p>
                          {t('settings.lastUsed', 'Zuletzt verwendet')}: {twoFactorLastUsed.toLocaleDateString(i18n.language, { 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      )}
                      {!twoFactorLastUsed && (
                        <p className="text-amber-600 dark:text-amber-400">
                          {t('settings.notYetTested', 'Noch nicht getestet')}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShow2FATestDialog(true)}
                      className="flex items-center gap-2"
                    >
                      <Key className="w-4 h-4" />
                      {t('settings.test2FA', '2FA testen')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={generateBackupCodes}
                      className="flex items-center gap-2"
                    >
                      <Shield className="w-4 h-4" />
                      {t('settings.generateBackupCodes', 'Backup-Codes generieren')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRegenerateQR(true)}
                      className="flex items-center gap-2"
                    >
                      <QrCode className="w-4 h-4" />
                      {t('settings.regenerateQR', 'QR-Code neu generieren')}
                    </Button>
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* Phone Number Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    {t('settings.phoneNumber', 'Telefonnummer')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.phoneNumberDescription', 'Fügen Sie eine Telefonnummer hinzu, um sich per SMS anzumelden oder MFA zu aktivieren')}
                  </p>
                </div>
                {!phoneNumber ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPhoneDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {t('settings.addPhoneNumber', 'Telefonnummer hinzufügen')}
                  </Button>
                ) : (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleRemovePhoneNumber}
                    disabled={isRemovingPhone}
                    className="flex items-center gap-2"
                  >
                    {isRemovingPhone ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    {t('settings.removePhoneNumber', 'Entfernen')}
                  </Button>
                )}
              </div>

              {phoneNumber && (
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{phoneNumber}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t('settings.phoneNumberStatus', 'Telefonnummer ist hinterlegt')}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <Separator className="my-4" />

            {/* MFA with Phone Section */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    {t('settings.mfaWithPhone', 'Multi-Faktor-Authentifizierung (MFA)')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.mfaWithPhoneDescription', 'Aktivieren Sie MFA mit Ihrer Telefonnummer als zweiten Faktor')}
                  </p>
                </div>
                <Switch
                  checked={mfaEnabled}
                  disabled={!phoneNumber || isEnablingMFA || isDisablingMFA}
                  onCheckedChange={async (checked) => {
                    if (checked) {
                      await handleEnableMFA();
                    } else {
                      await handleDisableMFA();
                    }
                  }}
                />
              </div>

              {!phoneNumber && (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                  <p className="text-sm text-amber-600 dark:text-amber-400">
                    {t('settings.phoneNumberRequiredForMFA', 'Bitte fügen Sie zuerst eine Telefonnummer hinzu, um MFA zu aktivieren')}
                  </p>
                </div>
              )}

              {mfaEnabled && phoneNumber && (
                <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        {t('settings.mfaEnabled', 'MFA ist aktiviert')}
                      </p>
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('settings.mfaEnabledDescription', 'Ihre Telefonnummer wird als zweiter Faktor verwendet')}
                  </p>
                </div>
              )}
            </div>
            
            {/* Passkeys Section */}
            <Separator className="my-4" />
            
            <div className="space-y-3">
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label className="flex items-center gap-2">
                    <Fingerprint className="w-4 h-4" />
                    {t('settings.passkeys', 'Passkeys')}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {t('settings.passkeysDescription', 'Melden Sie sich mit Fingerabdruck, Face ID oder Security Key an')}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddPasskeyDialog(true)}
                    className="flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    {t('settings.addPasskey', 'Passkey hinzufügen')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCleanupAllPasskeys}
                    disabled={isCleaningPasskeys || passkeys.length === 0}
                    className="flex items-center gap-2 text-orange-600 border-orange-300 hover:bg-orange-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isCleaningPasskeys ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                    Alle löschen
                  </Button>
                </div>
              </div>
              
              {isLoadingPasskeys ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : passkeys.length === 0 ? (
                <div className="p-4 rounded-lg bg-muted/50 border border-border">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-full">
                      <Fingerprint className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{t('settings.noPasskeys', 'Keine Passkeys registriert')}</p>
                      <p className="text-xs text-muted-foreground">
                        {t('settings.noPasskeysHint', 'Fügen Sie einen Passkey hinzu, um sich ohne Passwort anzumelden')}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  {passkeys.map((passkey) => (
                    <div key={passkey.id} className="p-3 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-500/10 rounded-full">
                          <Fingerprint className="w-4 h-4 text-green-500" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{passkey.deviceName}</p>
                          <p className="text-xs text-muted-foreground">
                            {passkey.createdAt ? (
                              <>
                                {t('settings.addedOn', 'Hinzugefügt am')} {new Date(passkey.createdAt).toLocaleDateString(i18n.language)}
                              </>
                            ) : null}
                            {passkey.lastUsed && (
                              <> · {t('settings.lastUsed', 'Zuletzt verwendet')}: {new Date(passkey.lastUsed).toLocaleDateString(i18n.language)}</>
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeletePasskey(passkey.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
          )}

          {/* Privacy & Data Section */}
          {activeCategory === 'privacy' && (
        <>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-muted-foreground" />
              <CardTitle>{t('settings.privacy', 'Datenschutz')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.privacyDescription', 'Verwalten Sie Ihre Daten und Privatsphäre')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Data Export & Import */}
            <div className="space-y-3">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <Download className="w-4 h-4" />
                  {t('settings.dataExport', 'Daten exportieren')}
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('settings.dataExportDescription', 'Laden Sie alle Ihre Daten als .nexo Datei herunter (GDPR-konform, nur von Nexo lesbar)')}
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={handleExportData}
                    disabled={isExportingData || isImportingData}
                  >
                    {isExportingData ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('settings.exporting', 'Exportiere...')}
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 mr-2" />
                        {t('settings.exportData', 'Daten exportieren')}
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => fileImportInputRef.current?.click()}
                    disabled={isExportingData || isImportingData}
                  >
                    {isImportingData ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        {t('settings.importing', 'Importiere...')}
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {t('settings.importData', 'Daten importieren')}
                      </>
                    )}
                  </Button>
                  <input
                    type="file"
                    ref={fileImportInputRef}
                    onChange={handleImportData}
                    className="hidden"
                    accept=".nexo"
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Delete Account */}
            <div className="space-y-3">
              <div>
                <Label className="flex items-center gap-2 mb-2 text-destructive">
                  <AlertTriangle className="w-4 h-4" />
                  {t('settings.deleteAccount', 'Konto löschen')}
                </Label>
                <p className="text-sm text-muted-foreground mb-3">
                  {t('settings.deleteAccountDescription', 'Löschen Sie Ihr Konto und alle zugehörigen Daten dauerhaft. Diese Aktion kann nicht rückgängig gemacht werden.')}
                </p>
                <Button
                  variant="destructive"
                  onClick={() => setShowDeleteAccountDialog(true)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('settings.deleteAccount', 'Konto löschen')}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        </>
          )}

          {/* API Keys & Integrations */}
          {activeCategory === 'api' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-muted-foreground" />
              <CardTitle>{t('settings.apiKeys', 'API-Schlüssel & Integrationen')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.apiKeysDescription', 'Verwalten Sie Ihre API-Schlüssel und externen Integrationen')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* OpenAI API Key */}
            <div className="space-y-2">
              <Label htmlFor="openaiApiKey" className="flex items-center gap-2">
                <Key className="w-4 h-4" />
                {t('settings.openaiApiKey', 'OpenAI API-Schlüssel')}
              </Label>
              <div className="relative">
                <Input
                  id="openaiApiKey"
                  type={showApiKey ? 'text' : 'password'}
                  value={openaiApiKey}
onChange={(e) => { 
                  setOpenaiApiKey(e.target.value);
                  handleFieldChange(e.target.closest('.space-y-2') as HTMLElement);
                }}
                  placeholder={t('settings.openaiApiKeyPlaceholder', 'sk-...')}
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                {t('settings.openaiApiKeyHint', 'API Key von platform.openai.com - Wird verschlüsselt gespeichert')}
              </p>
            </div>
          </CardContent>
        </Card>
          )}

          {/* Backup & Sync - Part of Privacy */}
          {activeCategory === 'privacy' && (
        <>
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Cloud className="w-5 h-5 text-muted-foreground" />
              <CardTitle>{t('settings.backupSync', 'Backup & Synchronisation')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.backupSyncDescription', 'Automatische Backups und Synchronisationseinstellungen')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Auto Backup */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <Cloud className="w-4 h-4" />
                  {t('settings.autoBackup', 'Automatisches Backup')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.autoBackupHint', 'Automatische Backups Ihrer Daten erstellen')}
                </p>
              </div>
              <Switch
                checked={autoBackupEnabled}
                onCheckedChange={(v) => handleSwitchChange(v, setAutoBackupEnabled, 'autoBackupEnabled')}
              />
            </div>

            {autoBackupEnabled && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label htmlFor="backupFrequency" className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {t('settings.backupFrequency', 'Backup-Häufigkeit')}
                  </Label>
                  <Select value={backupFrequency} onValueChange={(v) => handleSelectChange(v, setBackupFrequency, 'backupFrequency', 'backupFrequency')}>
                    <SelectTrigger id="backupFrequency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">{t('settings.daily', 'Täglich')}</SelectItem>
                      <SelectItem value="weekly">{t('settings.weekly', 'Wöchentlich')}</SelectItem>
                      <SelectItem value="monthly">{t('settings.monthly', 'Monatlich')}</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {t('settings.backupFrequencyHint', 'Wie oft sollen automatische Backups erstellt werden?')}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Advanced Privacy */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-muted-foreground" />
              <CardTitle>{t('settings.advancedPrivacy', 'Erweiterte Datenschutz-Einstellungen')}</CardTitle>
            </div>
            <CardDescription>
              {t('settings.advancedPrivacyDescription', 'Erweiterte Einstellungen für Datenschutz und Datenspeicherung')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Analytics */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  {t('settings.analytics', 'Analytics & Tracking')}
                </Label>
                <p className="text-sm text-muted-foreground">
                  {t('settings.analyticsHint', 'Helfen Sie uns, die App zu verbessern, indem Sie Nutzungsdaten teilen')}
                </p>
              </div>
              <Switch
                checked={analyticsEnabled}
                onCheckedChange={(v) => handleSwitchChange(v, setAnalyticsEnabled, 'analyticsEnabled')}
              />
            </div>

            <Separator />

            {/* Data Retention */}
            <div className="space-y-2">
              <Label htmlFor="dataRetention" className="flex items-center gap-2">
                <Clock className="w-4 h-4" />
                {t('settings.dataRetention', 'Datenspeicherung (Tage)')}
              </Label>
              <Input
                id="dataRetention"
                type="number"
                min="30"
                max="365"
                value={dataRetentionDays}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    return;
                  }
                  const numValue = parseInt(value, 10);
                  if (!isNaN(numValue)) {
                    if (numValue < 30) {
                      setDataRetentionDays(30);
                    } else if (numValue > 365) {
                      setDataRetentionDays(365);
                    } else {
                      setDataRetentionDays(numValue);
                    }
                  }
                }}
                onBlur={(e) => {
                  const value = parseInt(e.target.value, 10);
                  if (isNaN(value) || value < 30) {
                    setDataRetentionDays(30);
                  } else if (value > 365) {
                    setDataRetentionDays(365);
                  } else {
                    setDataRetentionDays(value);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                {t('settings.dataRetentionHint', 'Wie lange sollen Ihre Daten gespeichert werden? (30-365 Tage)')}
              </p>
            </div>
          </CardContent>
        </Card>
        </>
          )}

        </main>

        {/* Save Button Column - Right side, always present for consistent layout */}
        <aside className="w-40 shrink-0 hidden lg:block relative">
          {hasChanges && (
            <div 
              className="absolute flex flex-col gap-2 p-3 bg-card border rounded-lg shadow-lg animate-in slide-in-from-right-4 transition-all duration-300"
              style={{
                top: `${buttonTop}px`,
                width: '160px'
              }}
            >
              <Button 
                onClick={async () => {
                  await handleSave();
                  setHasChanges(false);
                  changedFieldRef.current = null;
                }} 
                disabled={isSaving}
                className="w-full min-w-[136px]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {t('common.loading', 'Laden...')}
                  </>
                ) : (
                  t('settings.save', 'Speichern')
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  window.location.reload();
                  setHasChanges(false);
                  changedFieldRef.current = null;
                }}
                className="w-full min-w-[136px]"
                size="sm"
              >
                {t('settings.reset', 'Zurücksetzen')}
              </Button>
            </div>
          )}
        </aside>
      </div>

      {/* Mobile: Floating Save Button */}
      {hasChanges && (
        <div className="lg:hidden fixed bottom-24 right-6 z-50 flex gap-3 p-4 bg-card border rounded-lg shadow-lg animate-in slide-in-from-bottom-4">
          <Button 
            variant="outline" 
            onClick={() => {
              window.location.reload();
              setHasChanges(false);
            }}
          >
            {t('settings.reset', 'Zurücksetzen')}
          </Button>
          <Button 
            onClick={async () => {
              await handleSave();
              setHasChanges(false);
            }} 
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {t('common.loading', 'Wird geladen...')}
              </>
            ) : (
              t('settings.save', 'Speichern')
            )}
          </Button>
        </div>
      )}

      {/* Password Change Dialog */}
      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.changePassword', 'Passwort ändern')}</DialogTitle>
            <DialogDescription>
              {t('settings.changePasswordDescription', 'Geben Sie Ihr aktuelles Passwort und das neue Passwort ein')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Current Password */}
            <div className="space-y-2">
              <Label htmlFor="currentPassword">{t('settings.currentPassword', 'Aktuelles Passwort')}</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('settings.currentPasswordPlaceholder', 'Aktuelles Passwort eingeben')}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="space-y-2">
              <Label htmlFor="newPassword">{t('settings.newPassword', 'Neues Passwort')}</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('settings.newPasswordPlaceholder', 'Neues Passwort eingeben (min. 6 Zeichen)')}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">{t('settings.confirmPassword', 'Passwort bestätigen')}</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('settings.confirmPasswordPlaceholder', 'Neues Passwort bestätigen')}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowPasswordDialog(false);
              setCurrentPassword('');
              setNewPassword('');
              setConfirmPassword('');
            }}>
              {t('common.cancel', 'Abbrechen')}
            </Button>
            <Button onClick={handlePasswordChange} disabled={isChangingPassword}>
              {isChangingPassword ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.loading', 'Wird geladen...')}
                </>
              ) : (
                t('settings.changePassword', 'Passwort ändern')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Email Change Dialog */}
      <Dialog open={showChangeEmailDialog} onOpenChange={setShowChangeEmailDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings.changeEmail', 'E-Mail ändern')}</DialogTitle>
            <DialogDescription>
              {t('settings.changeEmailDescription', 'Geben Sie Ihre neue E-Mail-Adresse ein. Sie erhalten eine Bestätigungs-E-Mail an die neue Adresse.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="currentEmail">{t('settings.currentEmail', 'Aktuelle E-Mail')}</Label>
              <Input
                id="currentEmail"
                type="email"
                value={email}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="newEmail">{t('settings.newEmail', 'Neue E-Mail')}</Label>
              <Input
                id="newEmail"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder={t('settings.newEmailPlaceholder', 'neue.email@beispiel.com')}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailChangePassword">{t('settings.password', 'Passwort')}</Label>
              <Input
                id="emailChangePassword"
                type="password"
                value={emailChangePassword}
                onChange={(e) => setEmailChangePassword(e.target.value)}
                placeholder={t('settings.passwordPlaceholder', 'Ihr aktuelles Passwort')}
              />
              <p className="text-xs text-muted-foreground">
                {t('settings.passwordRequiredForEmailChange', 'Passwort zur Bestätigung erforderlich')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowChangeEmailDialog(false);
              setNewEmail('');
              setEmailChangePassword('');
            }}>
              {t('common.cancel', 'Abbrechen')}
            </Button>
            <Button onClick={handleEmailChange} disabled={isChangingEmail || !newEmail || !emailChangePassword}>
              {isChangingEmail ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('common.loading', 'Wird geladen...')}
                </>
              ) : (
                t('settings.changeEmail', 'E-Mail ändern')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Account Dialog */}
      <Dialog open={showDeleteAccountDialog} onOpenChange={setShowDeleteAccountDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              {t('settings.deleteAccount', 'Konto löschen')}
            </DialogTitle>
            <DialogDescription>
              {t('settings.deleteAccountWarning', 'Diese Aktion kann nicht rückgängig gemacht werden. Alle Ihre Daten werden permanent gelöscht.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
              <p className="text-sm font-medium text-destructive mb-2">
                {t('settings.deleteAccountConfirmTitle', 'Bitte bestätigen Sie die Löschung')}
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                {t('settings.deleteAccountConfirmDescription', 'Geben Sie "LÖSCHEN" ein, um zu bestätigen, dass Sie Ihr Konto löschen möchten:')}
              </p>
              <Input
                value={deleteAccountConfirm}
                onChange={(e) => setDeleteAccountConfirm(e.target.value)}
                placeholder={t('settings.deleteConfirmText', 'LÖSCHEN')}
                className="font-mono"
              />
            </div>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p className="font-medium">{t('settings.whatWillBeDeleted', 'Was wird gelöscht:')}</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{t('settings.deleteReminders', 'Alle Erinnerungen')}</li>
                <li>{t('settings.deleteFinance', 'Alle Finanzdaten')}</li>
                <li>{t('settings.deleteChats', 'Alle Chat-Verläufe')}</li>
                <li>{t('settings.deleteSettings', 'Alle Einstellungen')}</li>
                <li>{t('settings.deleteAccount', 'Ihr Konto')}</li>
              </ul>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowDeleteAccountDialog(false);
              setDeleteAccountConfirm('');
            }}>
              {t('common.cancel', 'Abbrechen')}
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteAccount} 
              disabled={isDeletingAccount || deleteAccountConfirm !== t('settings.deleteConfirmText', 'LÖSCHEN')}
            >
              {isDeletingAccount ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('settings.deleting', 'Lösche...')}
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  {t('settings.deleteAccount', 'Konto löschen')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Setup Dialog */}
      <Dialog open={show2FASetup} onOpenChange={(open) => {
        if (!open && !twoFactorEnabled) {
          // If modal is closed and 2FA is not enabled, reset the toggle
          setTwoFactorEnabled(false);
          setTwoFactorSecret(null);
          setTwoFactorQRCode(null);
          setTwoFactorVerificationCode('');
        }
        setShow2FASetup(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              {t('settings.setup2FA', 'Zwei-Faktor-Authentifizierung einrichten')}
            </DialogTitle>
            <DialogDescription>
              {t('settings.setup2FADescription', 'Schützen Sie Ihr Konto mit einer Authenticator-App')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Step 1: QR Code */}
            {twoFactorQRCode && (
              <div className="flex flex-col items-center space-y-4">
                <div className="p-4 bg-white rounded-lg border-2 border-border">
                  {QRCodeComponent ? (
                    <QRCodeComponent value={twoFactorQRCode} size={200} />
                  ) : (
                    <div className="w-[200px] h-[200px] flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {t('settings.scanQRCode', 'Scannen Sie diesen QR-Code mit Ihrer Authenticator-App')}
                </p>
                {twoFactorSecret && (
                  <div className="w-full space-y-2">
                    <Label className="text-xs">{t('settings.manualEntry', 'Oder geben Sie diesen Code manuell ein:')}</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={twoFactorSecret}
                        readOnly
                        className="font-mono text-xs"
                        onClick={(e) => (e.target as HTMLInputElement).select()}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          navigator.clipboard.writeText(twoFactorSecret);
                          toast.success(t('settings.copied', 'Code kopiert!'));
                        }}
                      >
                        <Key className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Step 2: Verification */}
            <div className="space-y-2">
              <Label>{t('settings.enterVerificationCode', 'Geben Sie den Verifizierungscode ein')}</Label>
              <div className="relative">
                <Input
                  value={twoFactorVerificationCode.length > 3 ? twoFactorVerificationCode.slice(0, 3) + ' ' + twoFactorVerificationCode.slice(3) : twoFactorVerificationCode}
                  onChange={(e) => setTwoFactorVerificationCode(e.target.value.replace(/\D/g, '').replace(/\s/g, '').slice(0, 6))}
                  placeholder="000 000"
                  maxLength={7}
                  inputMode="numeric"
                  className="text-center text-2xl font-medium tracking-widest h-14"
                  disabled={isVerifying2FA}
                />
                {twoFactorVerificationCode.length === 6 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {t('settings.enterVerificationCodeHint', 'Geben Sie den 6-stelligen Code aus Ihrer Authenticator-App ein')}
              </p>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShow2FASetup(false);
                setTwoFactorVerificationCode('');
                setTwoFactorQRCode(null);
                setTwoFactorSecret(null);
                // Reset toggle if 2FA is not enabled
                if (!twoFactorEnabled) {
                  setTwoFactorEnabled(false);
                }
              }}
              disabled={isVerifying2FA}
            >
              {t('common.cancel', 'Abbrechen')}
            </Button>
            <Button
              onClick={verify2FACode}
              disabled={isVerifying2FA || twoFactorVerificationCode.length !== 6}
            >
              {isVerifying2FA ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('settings.verifying', 'Wird verifiziert...')}
                </>
              ) : (
                t('settings.verify', 'Verifizieren')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Success Dialog */}
      <Dialog open={show2FASuccessDialog} onOpenChange={setShow2FASuccessDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Shield className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              {t('settings.twoFactorEnabled', 'Zwei-Faktor-Authentifizierung aktiviert')}
            </DialogTitle>
            <DialogDescription>
              {t('settings.twoFactorSetupComplete', 'Ihr Konto ist jetzt durch Zwei-Faktor-Authentifizierung geschützt')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-20 h-20 rounded-full bg-green-500/10 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-green-500 flex items-center justify-center">
                  <Shield className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <p className="font-semibold text-lg">
                  {t('settings.setupSuccessful', 'Setup erfolgreich abgeschlossen!')}
                </p>
                <p className="text-sm text-muted-foreground">
                  {t('settings.twoFactorActiveDescription', 'Die Zwei-Faktor-Authentifizierung ist jetzt aktiv und schützt Ihr Konto. Bei jedem Login müssen Sie einen Code aus Ihrer Authenticator-App eingeben.')}
                </p>
              </div>
              
              {twoFactorSetupDate && (
                <div className="w-full p-4 bg-muted/50 rounded-lg border border-border">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t('settings.setupDate', 'Eingerichtet am')}:
                      </span>
                      <span className="font-medium">
                        {twoFactorSetupDate.toLocaleDateString(i18n.language, { 
                          year: 'numeric', 
                          month: 'long', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {t('settings.status', 'Status')}:
                      </span>
                      <span className="flex items-center gap-2 text-green-600 dark:text-green-400 font-medium">
                        <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                        {t('settings.active', 'Aktiv')}
                      </span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="w-full p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-start gap-2">
                  <Key className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>
                    {t('settings.twoFactorTip', 'Tipp: Speichern Sie Ihre Backup-Codes an einem sicheren Ort. Sie können sie in den Einstellungen generieren.')}
                  </span>
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              onClick={() => {
                setShow2FASuccessDialog(false);
              }}
              className="w-full"
            >
              <Shield className="w-4 h-4 mr-2" />
              {t('settings.understood', 'Verstanden')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add Passkey Dialog */}
      <Dialog open={showAddPasskeyDialog} onOpenChange={(open) => {
        if (!open && !isRegisteringPasskey) {
          setShowAddPasskeyDialog(false);
          setNewPasskeyName('');
        }
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-2 bg-green-500/10 rounded-lg">
                <Fingerprint className="w-5 h-5 text-green-500" />
              </div>
              {t('settings.addPasskey', 'Passkey hinzufügen')}
            </DialogTitle>
            <DialogDescription>
              {t('settings.addPasskeyDescription', 'Registrieren Sie einen Passkey, um sich ohne Passwort anzumelden')}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="passkeyName">{t('settings.passkeyName', 'Passkey-Name')}</Label>
              <Input
                id="passkeyName"
                value={newPasskeyName}
                onChange={(e) => setNewPasskeyName(e.target.value)}
                placeholder={t('settings.passkeyNamePlaceholder', 'z.B. MacBook Pro, iPhone')}
                disabled={isRegisteringPasskey}
              />
              <p className="text-xs text-muted-foreground">
                {t('settings.passkeyNameHint', 'Geben Sie einen Namen ein, um diesen Passkey später wiederzuerkennen')}
              </p>
            </div>
            
            <div className="p-4 bg-muted/50 rounded-lg border border-border">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-500/10 rounded-full mt-0.5">
                  <Fingerprint className="w-5 h-5 text-green-500" />
                </div>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{t('settings.passkeyInfo', 'Was sind Passkeys?')}</p>
                  <p className="text-muted-foreground">
                    {t('settings.passkeyInfoDesc', 'Passkeys sind sicherer als Passwörter und nutzen biometrische Daten wie Fingerabdruck oder Face ID. Sie werden auf Ihrem Gerät gespeichert.')}
                  </p>
                </div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowAddPasskeyDialog(false);
                setNewPasskeyName('');
              }}
              disabled={isRegisteringPasskey}
            >
              {t('common.cancel', 'Abbrechen')}
            </Button>
            <Button
              onClick={handleAddPasskey}
              disabled={isRegisteringPasskey}
              className="min-w-[120px] bg-green-500 hover:bg-green-600"
            >
              {isRegisteringPasskey ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('settings.registering', 'Registrieren...')}
                </>
              ) : (
                <>
                  <Fingerprint className="w-4 h-4 mr-2" />
                  {t('settings.registerPasskey', 'Passkey registrieren')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 2FA Test Dialog */}
      <Dialog open={show2FATestDialog} onOpenChange={setShow2FATestDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Key className="w-5 h-5" />
              {t('settings.test2FA', '2FA testen')}
            </DialogTitle>
            <DialogDescription>
              {t('settings.test2FADescription', 'Geben Sie einen Code aus Ihrer Authenticator-App ein, um zu testen, ob die Konfiguration korrekt ist')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t('settings.enterVerificationCode', 'Geben Sie den Verifizierungscode ein')}</Label>
              <div className="relative">
                <Input
                  value={twoFactorTestCode.length > 3 ? twoFactorTestCode.slice(0, 3) + ' ' + twoFactorTestCode.slice(3) : twoFactorTestCode}
                  onChange={(e) => setTwoFactorTestCode(e.target.value.replace(/\D/g, '').replace(/\s/g, '').slice(0, 6))}
                  placeholder="000 000"
                  maxLength={7}
                  inputMode="numeric"
                  className="text-center text-2xl font-medium tracking-widest h-14"
                  disabled={isTesting2FA}
                />
                {twoFactorTestCode.length === 6 && (
                  <div className="absolute right-3 top-1/2 -translate-y-1/2">
                    <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
                      <span className="text-white text-xs">✓</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {twoFactorTestResult === 'success' && (
              <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                <p className="text-sm text-green-600 dark:text-green-400 font-medium">
                  {t('settings.testSuccess', '✓ Test erfolgreich! Ihre 2FA-Konfiguration funktioniert korrekt.')}
                </p>
              </div>
            )}
            
            {twoFactorTestResult === 'error' && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                <p className="text-sm text-red-600 dark:text-red-400 font-medium">
                  {t('settings.testError', '✗ Test fehlgeschlagen. Bitte überprüfen Sie den Code und versuchen Sie es erneut.')}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShow2FATestDialog(false);
                setTwoFactorTestCode('');
                setTwoFactorTestResult(null);
              }}
              disabled={isTesting2FA}
            >
              {t('common.cancel', 'Abbrechen')}
            </Button>
            <Button
              onClick={test2FA}
              disabled={isTesting2FA || twoFactorTestCode.length !== 6}
            >
              {isTesting2FA ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('settings.testing', 'Teste...')}
                </>
              ) : (
                t('settings.test', 'Testen')
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              {t('settings.backupCodes', 'Backup-Codes')}
            </DialogTitle>
            <DialogDescription>
              {t('settings.backupCodesDescription', 'Speichern Sie diese Codes an einem sicheren Ort. Sie können sie verwenden, wenn Sie keinen Zugriff auf Ihre Authenticator-App haben.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border">
              <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                {backupCodes.map((code, index) => (
                  <div key={index} className="p-2 bg-background rounded border text-center">
                    {code}
                  </div>
                ))}
              </div>
            </div>
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-xs text-amber-600 dark:text-amber-400">
                {t('settings.backupCodesWarning', '⚠️ Diese Codes werden nur einmal angezeigt. Speichern Sie sie sicher.')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowBackupCodes(false)}>
              {t('common.close', 'Schließen')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Regenerate QR Code Dialog */}
      <Dialog open={showRegenerateQR} onOpenChange={setShowRegenerateQR}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <QrCode className="w-5 h-5" />
              {t('settings.regenerateQR', 'QR-Code neu generieren')}
            </DialogTitle>
            <DialogDescription>
              {t('settings.regenerateQRDescription', 'Wenn Sie den QR-Code neu generieren, müssen Sie ihn erneut in Ihrer Authenticator-App scannen. Der alte Code funktioniert nicht mehr.')}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-sm text-amber-600 dark:text-amber-400">
                {t('settings.regenerateQRWarning', '⚠️ Achtung: Wenn Sie den QR-Code neu generieren, müssen Sie ihn erneut in Ihrer Authenticator-App scannen. Der alte Code wird ungültig.')}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowRegenerateQR(false)}
            >
              {t('common.cancel', 'Abbrechen')}
            </Button>
            <Button
              onClick={regenerateQRCode}
              variant="destructive"
            >
              {t('settings.regenerate', 'Neu generieren')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Phone Number Dialog */}
      <Dialog open={showPhoneDialog} onOpenChange={setShowPhoneDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {phoneVerificationId
                ? t('settings.verifyPhoneNumber', 'Telefonnummer verifizieren')
                : t('settings.addPhoneNumber', 'Telefonnummer hinzufügen')}
            </DialogTitle>
            <DialogDescription>
              {phoneVerificationId
                ? t('settings.enterVerificationCodePhone', 'Geben Sie den 6-stelligen Code ein, den Sie per SMS erhalten haben')
                : t('settings.addPhoneNumberDescription', 'Geben Sie Ihre Telefonnummer ein, um sich per SMS anzumelden oder MFA zu aktivieren')}
            </DialogDescription>
          </DialogHeader>
          
          {!phoneVerificationId ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-phone">{t('settings.phoneNumber', 'Telefonnummer')}</Label>
                <Input
                  id="new-phone"
                  type="tel"
                  placeholder="+41 79 123 45 67"
                  value={newPhoneNumber}
                  onChange={(e) => {
                    const formatted = formatPhoneNumber(e.target.value);
                    setNewPhoneNumber(formatted);
                  }}
                  disabled={isSendingPhoneSMS}
                />
                <p className="text-xs text-muted-foreground">
                  {t('settings.phoneFormatHint', 'Format: +[Ländercode][Nummer], z.B. +41 79 123 45 67')}
                </p>
              </div>
              <div id="recaptcha-container-phone" style={{ display: 'none' }} />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="phone-verification-code">{t('settings.verificationCode', 'Verifizierungscode')}</Label>
                <Input
                  id="phone-verification-code"
                  type="text"
                  placeholder="000 000"
                  value={phoneVerificationCode.length > 3 ? phoneVerificationCode.slice(0, 3) + ' ' + phoneVerificationCode.slice(3) : phoneVerificationCode}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, '').replace(/\s/g, '').slice(0, 6);
                    setPhoneVerificationCode(value);
                  }}
                  maxLength={7}
                  inputMode="numeric"
                  disabled={isVerifyingPhone}
                  autoFocus
                />
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowPhoneDialog(false);
                setNewPhoneNumber('');
                setPhoneVerificationCode('');
                setPhoneVerificationId(null);
              }}
              disabled={isSendingPhoneSMS || isVerifyingPhone}
            >
              {t('common.cancel', 'Abbrechen')}
            </Button>
            <Button
              onClick={phoneVerificationId ? handleVerifyPhoneNumber : handleAddPhoneNumber}
              disabled={isSendingPhoneSMS || isVerifyingPhone || (phoneVerificationId ? phoneVerificationCode.length !== 6 : !newPhoneNumber.trim())}
              className="min-w-[120px]"
            >
              {isSendingPhoneSMS || isVerifyingPhone ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isSendingPhoneSMS ? t('auth.login.sending', 'Wird gesendet...') : t('settings.verifying', 'Wird verifiziert...')}
                </>
              ) : (
                <>
                  <Phone className="w-4 h-4 mr-2" />
                  {phoneVerificationId ? t('settings.verify', 'Verifizieren') : t('auth.login.sendSMS', 'SMS senden')}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Passkey Confirmation Dialog */}
      <AlertDialog open={showDeletePasskeyDialog} onOpenChange={setShowDeletePasskeyDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.deletePasskeyTitle', 'Passkey löschen')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.deletePasskeyConfirm', 'Möchten Sie diesen Passkey wirklich löschen?')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPasskeyToDelete(null)}>
              {t('common.cancel', 'Abbrechen')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeletePasskeyConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.delete', 'Löschen')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Remove Phone Number Confirmation Dialog */}
      <AlertDialog open={showRemovePhoneDialog} onOpenChange={setShowRemovePhoneDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.removePhoneTitle', 'Telefonnummer entfernen')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.removePhoneConfirm', 'Möchten Sie die Telefonnummer wirklich entfernen?')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Abbrechen')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleRemovePhoneNumberConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.remove', 'Entfernen')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable MFA Confirmation Dialog */}
      <AlertDialog open={showDisableMFADialog} onOpenChange={setShowDisableMFADialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.disableMFATitle', 'MFA deaktivieren')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.disableMFAConfirm', 'Möchten Sie die Multi-Faktor-Authentifizierung wirklich deaktivieren?')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Abbrechen')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDisableMFAConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.disable', 'Deaktivieren')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disable 2FA Confirmation Dialog */}
      <AlertDialog open={showDisable2FADialog} onOpenChange={(open) => {
        setShowDisable2FADialog(open);
        if (!open) {
          // Reset toggle if user cancels
          setTwoFactorEnabled(true);
        }
      }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('settings.disable2FATitle', '2FA deaktivieren')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('settings.disable2FAConfirm', 'Möchten Sie die Zwei-Faktor-Authentifizierung wirklich deaktivieren?')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel', 'Abbrechen')}</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              await disable2FA();
              setShowDisable2FADialog(false);
            }} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('common.disable', 'Deaktivieren')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Layout>
  );
}
