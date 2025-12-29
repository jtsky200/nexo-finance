import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AspectRatio } from "@/components/ui/aspect-ratio";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Input } from "@/components/ui/input";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarTrigger,
} from "@/components/ui/menubar";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Toggle } from "@/components/ui/toggle";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/contexts/ThemeContext";
import { format } from "date-fns";
import { zhCN } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import {
  AlertCircle,
  CalendarIcon,
  Check,
  Clock,
  Moon,
  Sun,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast as sonnerToast } from "sonner";
import { AIChatBox, type Message } from "@/components/AIChatBox";
import { useTranslation } from "react-i18next";

export default function ComponentsShowcase() {
  const { t } = useTranslation();
  const { theme, toggleTheme } = useTheme();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [datePickerDate, setDatePickerDate] = useState<Date>();
  const [selectedFruits, setSelectedFruits] = useState<string[]>([]);
  const [progress, setProgress] = useState(33);
  const [currentPage, setCurrentPage] = useState(2);
  const [openCombobox, setOpenCombobox] = useState(false);
  const [selectedFramework, setSelectedFramework] = useState("");
  const [selectedMonth, setSelectedMonth] = useState("");
  const [selectedYear, setSelectedYear] = useState("");
  const [dialogInput, setDialogInput] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  // AI ChatBox demo state
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { role: "system", content: "You are a helpful assistant." },
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);

  const handleDialogSubmit = () => {
    sonnerToast.success(t('common.submittedSuccessfully', 'Erfolgreich übermittelt'), {
      description: `Input: ${dialogInput}`,
    });
    setDialogInput("");
    setDialogOpen(false);
  };

  const handleDialogKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleDialogSubmit();
    }
  };

  const handleChatSend = (content: string) => {
    // Add user message
    const newMessages: Message[] = [...chatMessages, { role: "user", content }];
    setChatMessages(newMessages);

    // Simulate AI response with delay
    setIsChatLoading(true);
    setTimeout(() => {
      const aiResponse: Message = {
        role: "assistant",
        content: `This is a **demo response**. In a real app, you would call a tRPC mutation here:\n\n\`\`\`typescript\nconst chatMutation = trpc.ai.chat.useMutation({\n  onSuccess: (response) => {\n    setChatMessages(prev => [...prev, {\n      role: "assistant",\n      content: response.choices[0].message.content\n    }]);\n  }\n});\n\nchatMutation.mutate({ messages: newMessages });\n\`\`\`\n\nYour message was: "${content}"`,
      };
      setChatMessages([...newMessages, aiResponse]);
      setIsChatLoading(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <main className="container max-w-6xl mx-auto">
        <div className="space-y-2 justify-between flex">
          <h2 className="text-3xl font-bold tracking-tight mb-6">
            {t('showcase.title', 'Shadcn/ui Komponenten-Bibliothek')}
          </h2>
          <Button variant="outline" size="icon" onClick={toggleTheme}>
            {theme === "light" ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="space-y-12">
          {/* Text Colors Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('showcase.textColors', 'Textfarben')}</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {t('showcase.foregroundDefault', 'Vordergrund (Standard)')}
                      </p>
                      <p className="text-foreground text-lg">
                        {t('showcase.foregroundDefaultDesc', 'Standard-Textfarbe für Hauptinhalt')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {t('showcase.mutedForeground', 'Gedämpfter Vordergrund')}
                      </p>
                      <p className="text-muted-foreground text-lg">
                        {t('showcase.mutedForegroundDesc', 'Gedämpfter Text für sekundäre Informationen')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {t('showcase.primary', 'Primär')}
                      </p>
                      <p className="text-primary text-lg font-medium">
                        {t('showcase.primaryDesc', 'Primäre Markenfarbe für Text')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {t('showcase.secondaryForeground', 'Sekundärer Vordergrund')}
                      </p>
                      <p className="text-secondary-foreground text-lg">
                        {t('showcase.secondaryForegroundDesc', 'Sekundäre Aktions-Textfarbe')}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {t('showcase.accentForeground', 'Akzent-Vordergrund')}
                      </p>
                      <p className="text-accent-foreground text-lg">
                        {t('showcase.accentForegroundDesc', 'Akzent-Text zur Hervorhebung')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {t('showcase.destructive', 'Destruktiv')}
                      </p>
                      <p className="text-destructive text-lg font-medium">
                        {t('showcase.destructiveDesc', 'Fehler- oder destruktive Aktions-Textfarbe')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {t('showcase.cardForeground', 'Karten-Vordergrund')}
                      </p>
                      <p className="text-card-foreground text-lg">
                        {t('showcase.cardForegroundDesc', 'Textfarbe auf Karten-Hintergründen')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {t('showcase.popoverForeground', 'Popover-Vordergrund')}
                      </p>
                      <p className="text-popover-foreground text-lg">
                        {t('showcase.popoverForegroundDesc', 'Textfarbe in Popovers')}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Color Combinations Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('showcase.colorCombinations', 'Farbkombinationen')}</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="bg-primary text-primary-foreground rounded-lg p-4">
                    <p className="font-medium mb-1">{t('showcase.primaryBg', 'Primär')}</p>
                    <p className="text-sm opacity-90">
                      {t('showcase.primaryBgDesc', 'Primärer Hintergrund mit Vordergrund-Text')}
                    </p>
                  </div>
                  <div className="bg-secondary text-secondary-foreground rounded-lg p-4">
                    <p className="font-medium mb-1">{t('showcase.secondaryBg', 'Sekundär')}</p>
                    <p className="text-sm opacity-90">
                      {t('showcase.secondaryBgDesc', 'Sekundärer Hintergrund mit Vordergrund-Text')}
                    </p>
                  </div>
                  <div className="bg-muted text-muted-foreground rounded-lg p-4">
                    <p className="font-medium mb-1">{t('showcase.mutedBg', 'Gedämpft')}</p>
                    <p className="text-sm opacity-90">
                      {t('showcase.mutedBgDesc', 'Gedämpfter Hintergrund mit Vordergrund-Text')}
                    </p>
                  </div>
                  <div className="bg-accent text-accent-foreground rounded-lg p-4">
                    <p className="font-medium mb-1">{t('showcase.accentBg', 'Akzent')}</p>
                    <p className="text-sm opacity-90">
                      {t('showcase.accentBgDesc', 'Akzent-Hintergrund mit Vordergrund-Text')}
                    </p>
                  </div>
                  <div className="bg-destructive text-destructive-foreground rounded-lg p-4">
                    <p className="font-medium mb-1">{t('showcase.destructiveBg', 'Destruktiv')}</p>
                    <p className="text-sm opacity-90">
                      {t('showcase.destructiveBgDesc', 'Destruktiver Hintergrund mit Vordergrund-Text')}
                    </p>
                  </div>
                  <div className="bg-card text-card-foreground rounded-lg p-4 border">
                    <p className="font-medium mb-1">{t('showcase.cardBg', 'Karte')}</p>
                    <p className="text-sm opacity-90">
                      {t('showcase.cardBgDesc', 'Karten-Hintergrund mit Vordergrund-Text')}
                    </p>
                  </div>
                  <div className="bg-popover text-popover-foreground rounded-lg p-4 border">
                    <p className="font-medium mb-1">{t('showcase.popoverBg', 'Popover')}</p>
                    <p className="text-sm opacity-90">
                      {t('showcase.popoverBgDesc', 'Popover-Hintergrund mit Vordergrund-Text')}
                    </p>
                  </div>
                  <div className="bg-background text-foreground rounded-lg p-4 border">
                    <p className="font-medium mb-1">{t('showcase.background', 'Hintergrund')}</p>
                    <p className="text-sm opacity-90">
                      {t('showcase.backgroundDesc', 'Standard-Hintergrund mit Vordergrund-Text')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Buttons Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('showcase.buttons', 'Buttons')}</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <Button>{t('showcase.default', 'Standard')}</Button>
                  <Button variant="secondary">{t('showcase.secondary', 'Sekundär')}</Button>
                  <Button variant="destructive">{t('showcase.destructive', 'Destruktiv')}</Button>
                  <Button variant="outline">{t('showcase.outline', 'Umriss')}</Button>
                  <Button variant="ghost">{t('showcase.ghost', 'Geist')}</Button>
                  <Button variant="link">{t('showcase.link', 'Link')}</Button>
                  <Button size="sm">{t('showcase.small', 'Klein')}</Button>
                  <Button size="lg">{t('showcase.large', 'Gross')}</Button>
                  <Button size="icon">
                    <Check className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Form Inputs Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('showcase.formInputs', 'Formulareingaben')}</h3>
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email">{t('showcase.email', 'E-Mail')}</Label>
                  <Input id="email" type="email" placeholder={t('common.email')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="message">{t('showcase.message', 'Nachricht')}</Label>
                  <Textarea
                    id="message"
                    placeholder={t('showcase.messagePlaceholder', 'Geben Sie hier Ihre Nachricht ein.')}
                  />
                </div>
                <div className="space-y-2">
                  <Label>{t('showcase.select', 'Auswählen')}</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder={t('showcase.selectFruit', 'Wählen Sie eine Frucht')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="apple">{t('showcase.apple', 'Apfel')}</SelectItem>
                      <SelectItem value="banana">{t('showcase.banana', 'Banane')}</SelectItem>
                      <SelectItem value="orange">{t('showcase.orange', 'Orange')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox id="terms" />
                  <Label htmlFor="terms">{t('showcase.acceptTerms', 'Bedingungen akzeptieren')}</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <Switch id="airplane-mode" />
                  <Label htmlFor="airplane-mode">{t('showcase.airplaneMode', 'Flugzeugmodus')}</Label>
                </div>
                <div className="space-y-2">
                  <Label>{t('showcase.radioGroup', 'Radio-Gruppe')}</Label>
                  <RadioGroup defaultValue="option-one">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option-one" id="option-one" />
                      <Label htmlFor="option-one">{t('showcase.optionOne', 'Option Eins')}</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="option-two" id="option-two" />
                      <Label htmlFor="option-two">{t('showcase.optionTwo', 'Option Zwei')}</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="space-y-2">
                  <Label>{t('showcase.slider', 'Schieberegler')}</Label>
                  <Slider defaultValue={[50]} max={100} step={1} />
                </div>
                <div className="space-y-2">
                  <Label>{t('showcase.inputOTP', 'OTP-Eingabe')}</Label>
                  <InputOTP maxLength={6}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <div className="space-y-2">
                  <Label>{t('showcase.dateTimePicker', 'Datum & Zeit Auswahl')}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={`w-full justify-start text-left font-normal ${
                          !datePickerDate && "text-muted-foreground"
                        }`}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {datePickerDate ? (
                          format(datePickerDate, "PPP HH:mm", { locale: zhCN })
                        ) : (
                          <span>{t('showcase.selectDateTime', 'Datum und Uhrzeit auswählen')}</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <div className="p-3 space-y-3">
                        <Calendar
                          mode="single"
                          selected={datePickerDate}
                          onSelect={setDatePickerDate}
                        />
                        <div className="border-t pt-3 space-y-2">
                          <Label className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {t('showcase.time', 'Zeit')}
                          </Label>
                          <div className="flex gap-2">
                            <Input
                              type="time"
                              value={
                                datePickerDate
                                  ? format(datePickerDate, "HH:mm")
                                  : "00:00"
                              }
                              onChange={e => {
                                const [hours, minutes] =
                                  e.target.value.split(":");
                                const newDate = datePickerDate
                                  ? new Date(datePickerDate)
                                  : new Date();
                                newDate.setHours(parseInt(hours));
                                newDate.setMinutes(parseInt(minutes));
                                setDatePickerDate(newDate);
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                  {datePickerDate && (
                    <p className="text-sm text-muted-foreground">
                      {t('showcase.selected', 'Ausgewählt')}:{" "}
                      {format(datePickerDate, "yyyy/MM/dd  HH:mm", {
                        locale: zhCN,
                      })}
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>{t('showcase.searchableDropdown', 'Durchsuchbares Dropdown')}</Label>
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className="w-full justify-between"
                      >
                        {selectedFramework
                          ? [
                              { value: "react", label: "React" },
                              { value: "vue", label: "Vue" },
                              { value: "angular", label: "Angular" },
                              { value: "svelte", label: "Svelte" },
                              { value: "nextjs", label: "Next.js" },
                              { value: "nuxt", label: "Nuxt" },
                              { value: "remix", label: "Remix" },
                            ].find(fw => fw.value === selectedFramework)?.label
                          : t('showcase.selectFramework', 'Framework auswählen...')}
                        <CalendarIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput placeholder={t('showcase.searchFrameworks', 'Frameworks suchen...')} />
                        <CommandList>
                          <CommandEmpty>{t('showcase.noFrameworkFound', 'Kein Framework gefunden')}</CommandEmpty>
                          <CommandGroup>
                            {[
                              { value: "react", label: "React" },
                              { value: "vue", label: "Vue" },
                              { value: "angular", label: "Angular" },
                              { value: "svelte", label: "Svelte" },
                              { value: "nextjs", label: "Next.js" },
                              { value: "nuxt", label: "Nuxt" },
                              { value: "remix", label: "Remix" },
                            ].map(framework => (
                              <CommandItem
                                key={framework.value}
                                value={framework.value}
                                onSelect={currentValue => {
                                  setSelectedFramework(
                                    currentValue === selectedFramework
                                      ? ""
                                      : currentValue
                                  );
                                  setOpenCombobox(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${
                                    selectedFramework === framework.value
                                      ? "opacity-100"
                                      : "opacity-0"
                                  }`}
                                />
                                {framework.label}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  {selectedFramework && (
                    <p className="text-sm text-muted-foreground">
                      {t('showcase.selected', 'Ausgewählt')}:{" "}
                      {
                        [
                          { value: "react", label: "React" },
                          { value: "vue", label: "Vue" },
                          { value: "angular", label: "Angular" },
                          { value: "svelte", label: "Svelte" },
                          { value: "nextjs", label: "Next.js" },
                          { value: "nuxt", label: "Nuxt" },
                          { value: "remix", label: "Remix" },
                        ].find(fw => fw.value === selectedFramework)?.label
                      }
                    </p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="month" className="text-sm font-medium">
                        {t('showcase.month', 'Monat')}
                      </Label>
                      <Select
                        value={selectedMonth}
                        onValueChange={setSelectedMonth}
                      >
                        <SelectTrigger id="month">
                          <SelectValue placeholder="MM" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 12 }, (_, i) => i + 1).map(
                            month => (
                              <SelectItem
                                key={month}
                                value={month.toString().padStart(2, "0")}
                              >
                                {month.toString().padStart(2, "0")}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="year" className="text-sm font-medium">
                        {t('showcase.year', 'Jahr')}
                      </Label>
                      <Select
                        value={selectedYear}
                        onValueChange={setSelectedYear}
                      >
                        <SelectTrigger id="year">
                          <SelectValue placeholder="YYYY" />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from(
                            { length: 10 },
                            (_, i) => new Date().getFullYear() - 5 + i
                          ).map(year => (
                            <SelectItem key={year} value={year.toString()}>
                              {year}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {selectedMonth && selectedYear && (
                    <p className="text-sm text-muted-foreground">
                      {t('showcase.selected', 'Ausgewählt')}: {selectedYear}/{selectedMonth}/
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Data Display Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('showcase.dataDisplay', 'Datenanzeige')}</h3>
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label>{t('showcase.badges', 'Abzeichen')}</Label>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{t('showcase.default', 'Standard')}</Badge>
                    <Badge variant="secondary">{t('showcase.secondary', 'Sekundär')}</Badge>
                    <Badge variant="destructive">{t('showcase.destructive', 'Destruktiv')}</Badge>
                    <Badge variant="outline">{t('showcase.outline', 'Umriss')}</Badge>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>{t('showcase.avatar', 'Avatar')}</Label>
                  <div className="flex gap-4">
                    <Avatar>
                      <AvatarImage src="https://github.com/shadcn.png" />
                      <AvatarFallback>CN</AvatarFallback>
                    </Avatar>
                    <Avatar>
                      <AvatarFallback>AB</AvatarFallback>
                    </Avatar>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>{t('showcase.progress', 'Fortschritt')}</Label>
                  <Progress value={progress} />
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => setProgress(Math.max(0, progress - 10))}
                    >
                      -10
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => setProgress(Math.min(100, progress + 10))}
                    >
                      +10
                    </Button>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>{t('showcase.skeleton', 'Skelett')}</Label>
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>{t('showcase.pagination', 'Seitennummerierung')}</Label>
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={e => {
                            e.preventDefault();
                            setCurrentPage(Math.max(1, currentPage - 1));
                          }}
                        />
                      </PaginationItem>
                      {[1, 2, 3, 4, 5].map(page => (
                        <PaginationItem key={page}>
                          <PaginationLink
                            href="#"
                            isActive={currentPage === page}
                            onClick={e => {
                              e.preventDefault();
                              setCurrentPage(page);
                            }}
                          >
                            {page}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={e => {
                            e.preventDefault();
                            setCurrentPage(Math.min(5, currentPage + 1));
                          }}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  <p className="text-sm text-muted-foreground text-center">
                    {t('showcase.currentPage', 'Aktuelle Seite')}: {currentPage}
                  </p>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>{t('showcase.table', 'Tabelle')}</Label>
                  <Table>
                    <TableCaption>{t('showcase.invoiceList', 'Eine Liste Ihrer letzten Rechnungen.')}</TableCaption>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">{t('showcase.invoice', 'Rechnung')}</TableHead>
                        <TableHead>{t('showcase.status', 'Status')}</TableHead>
                        <TableHead>{t('showcase.method', 'Methode')}</TableHead>
                        <TableHead className="text-right">{t('showcase.amount', 'Betrag')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-medium">INV001</TableCell>
                        <TableCell>{t('showcase.paid', 'Bezahlt')}</TableCell>
                        <TableCell>{t('showcase.creditCard', 'Kreditkarte')}</TableCell>
                        <TableCell className="text-right">$250.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">INV002</TableCell>
                        <TableCell>{t('showcase.pending', 'Ausstehend')}</TableCell>
                        <TableCell>{t('showcase.paypal', 'PayPal')}</TableCell>
                        <TableCell className="text-right">$150.00</TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="font-medium">INV003</TableCell>
                        <TableCell>{t('showcase.unpaid', 'Unbezahlt')}</TableCell>
                        <TableCell>{t('showcase.bankTransfer', 'Banküberweisung')}</TableCell>
                        <TableCell className="text-right">$350.00</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>{t('showcase.menubar', 'Menüleiste')}</Label>
                  <Menubar>
                    <MenubarMenu>
                      <MenubarTrigger>{t('showcase.file', 'Datei')}</MenubarTrigger>
                      <MenubarContent>
                        <MenubarItem>{t('showcase.newTab', 'Neuer Tab')}</MenubarItem>
                        <MenubarItem>{t('showcase.newWindow', 'Neues Fenster')}</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem>{t('showcase.share', 'Teilen')}</MenubarItem>
                        <MenubarSeparator />
                        <MenubarItem>{t('showcase.print', 'Drucken')}</MenubarItem>
                      </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                      <MenubarTrigger>{t('showcase.edit', 'Bearbeiten')}</MenubarTrigger>
                      <MenubarContent>
                        <MenubarItem>{t('showcase.undo', 'Rückgängig')}</MenubarItem>
                        <MenubarItem>{t('showcase.redo', 'Wiederholen')}</MenubarItem>
                      </MenubarContent>
                    </MenubarMenu>
                    <MenubarMenu>
                      <MenubarTrigger>{t('showcase.view', 'Ansicht')}</MenubarTrigger>
                      <MenubarContent>
                        <MenubarItem>{t('showcase.reload', 'Neu laden')}</MenubarItem>
                        <MenubarItem>{t('showcase.forceReload', 'Erzwingen neu laden')}</MenubarItem>
                      </MenubarContent>
                    </MenubarMenu>
                  </Menubar>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>{t('showcase.breadcrumb', 'Breadcrumb')}</Label>
                  <Breadcrumb>
                    <BreadcrumbList>
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/">{t('showcase.home', 'Startseite')}</BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbLink href="/components">
                          {t('showcase.components', 'Komponenten')}
                        </BreadcrumbLink>
                      </BreadcrumbItem>
                      <BreadcrumbSeparator />
                      <BreadcrumbItem>
                        <BreadcrumbPage>{t('showcase.breadcrumb', 'Breadcrumb')}</BreadcrumbPage>
                      </BreadcrumbItem>
                    </BreadcrumbList>
                  </Breadcrumb>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Alerts Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('showcase.alerts', 'Warnungen')}</h3>
            <div className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{t('showcase.headsUp', 'Achtung!')}</AlertTitle>
                <AlertDescription>
                  {t('showcase.headsUpDesc', 'Sie können Komponenten zu Ihrer App mit der CLI hinzufügen.')}
                </AlertDescription>
              </Alert>
              <Alert variant="destructive">
                <X className="h-4 w-4" />
                <AlertTitle>{t('showcase.error', 'Fehler')}</AlertTitle>
                <AlertDescription>
                  {t('showcase.errorDesc', 'Ihre Sitzung ist abgelaufen. Bitte melden Sie sich erneut an.')}
                </AlertDescription>
              </Alert>
            </div>
          </section>

          {/* Tabs Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('showcase.tabs', 'Tabs')}</h3>
            <Tabs defaultValue="account" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="account">{t('showcase.account', 'Konto')}</TabsTrigger>
                <TabsTrigger value="password">{t('showcase.password', 'Passwort')}</TabsTrigger>
                <TabsTrigger value="settings">{t('showcase.settings', 'Einstellungen')}</TabsTrigger>
              </TabsList>
              <TabsContent value="account">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('showcase.account', 'Konto')}</CardTitle>
                    <CardDescription>
                      {t('showcase.makeChanges', 'Nehmen Sie hier Änderungen an Ihrem Konto vor.')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="name">{t('showcase.name', 'Name')}</Label>
                      <Input id="name" defaultValue="Pedro Duarte" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>{t('showcase.saveChanges', 'Änderungen speichern')}</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="password">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('showcase.password', 'Passwort')}</CardTitle>
                    <CardDescription>
                      {t('showcase.changePassword', 'Ändern Sie hier Ihr Passwort.')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="space-y-1">
                      <Label htmlFor="current">{t('showcase.currentPassword', 'Aktuelles Passwort')}</Label>
                      <Input id="current" type="password" />
                    </div>
                    <div className="space-y-1">
                      <Label htmlFor="new">{t('showcase.newPassword', 'Neues Passwort')}</Label>
                      <Input id="new" type="password" />
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button>{t('showcase.savePassword', 'Passwort speichern')}</Button>
                  </CardFooter>
                </Card>
              </TabsContent>
              <TabsContent value="settings">
                <Card>
                  <CardHeader>
                    <CardTitle>{t('showcase.settings', 'Einstellungen')}</CardTitle>
                    <CardDescription>
                      {t('showcase.manageSettings', 'Verwalten Sie hier Ihre Einstellungen.')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      {t('showcase.settingsContent', 'Einstellungsinhalt kommt hier hin.')}
                    </p>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </section>

          {/* Accordion Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('showcase.accordion', 'Accordion')}</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1">
                <AccordionTrigger>{t('showcase.isAccessible', 'Ist es zugänglich?')}</AccordionTrigger>
                <AccordionContent>
                  {t('showcase.accessibleAnswer', 'Ja. Es entspricht dem WAI-ARIA-Designmuster.')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2">
                <AccordionTrigger>{t('showcase.isStyled', 'Ist es gestylt?')}</AccordionTrigger>
                <AccordionContent>
                  {t('showcase.styledAnswer', 'Ja. Es kommt mit Standard-Stilen, die zur Ästhetik der anderen Komponenten passen.')}
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3">
                <AccordionTrigger>{t('showcase.isAnimated', 'Ist es animiert?')}</AccordionTrigger>
                <AccordionContent>
                  {t('showcase.animatedAnswer', 'Ja. Es ist standardmässig animiert, aber Sie können es deaktivieren, wenn Sie möchten.')}
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </section>

          {/* Collapsible Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('showcase.collapsible', 'Zusammenklappbar')}</h3>
            <Collapsible>
              <Card>
                <CardHeader>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between">
                      <CardTitle>{t('showcase.starredRepos', '@peduarte hat 3 Repositories markiert')}</CardTitle>
                    </Button>
                  </CollapsibleTrigger>
                </CardHeader>
                <CollapsibleContent>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="rounded-md border px-4 py-3 font-mono text-sm">
                        @radix-ui/primitives
                      </div>
                      <div className="rounded-md border px-4 py-3 font-mono text-sm">
                        @radix-ui/colors
                      </div>
                      <div className="rounded-md border px-4 py-3 font-mono text-sm">
                        @stitches/react
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          </section>

          {/* Dialog, Sheet, Drawer Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('showcase.overlays', 'Overlays')}</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline">{t('showcase.openDialog', 'Dialog öffnen')}</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>{t('showcase.testInput', 'Test-Eingabe')}</DialogTitle>
                        <DialogDescription>
                          {t('showcase.testInputDesc', 'Geben Sie unten Text ein. Drücken Sie Enter zum Absenden (IME-Komposition unterstützt).')}
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label htmlFor="dialog-input">{t('showcase.input', 'Eingabe')}</Label>
                          <Input
                            id="dialog-input"
                            placeholder={t('showcase.typeSomething', 'Geben Sie etwas ein...')}
                            value={dialogInput}
                            onChange={(e) => setDialogInput(e.target.value)}
                            onKeyDown={handleDialogKeyDown}
                            autoFocus
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setDialogOpen(false)}
                        >
                          {t('showcase.cancel', 'Abbrechen')}
                        </Button>
                        <Button onClick={handleDialogSubmit}>{t('showcase.submit', 'Absenden')}</Button>
                      </div>
                    </DialogContent>
                  </Dialog>

                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline">{t('showcase.openSheet', 'Blatt öffnen')}</Button>
                    </SheetTrigger>
                    <SheetContent>
                      <SheetHeader>
                        <SheetTitle>{t('showcase.editProfile', 'Profil bearbeiten')}</SheetTitle>
                        <SheetDescription>
                          {t('showcase.editProfileDesc', 'Nehmen Sie hier Änderungen an Ihrem Profil vor. Klicken Sie auf Speichern, wenn Sie fertig sind.')}
                        </SheetDescription>
                      </SheetHeader>
                    </SheetContent>
                  </Sheet>

                  <Drawer>
                    <DrawerTrigger asChild>
                      <Button variant="outline">{t('showcase.openDrawer', 'Schublade öffnen')}</Button>
                    </DrawerTrigger>
                    <DrawerContent>
                      <DrawerHeader>
                        <DrawerTitle>{t('showcase.absolutelySure', 'Sind Sie absolut sicher?')}</DrawerTitle>
                        <DrawerDescription>
                          {t('showcase.cannotUndo', 'Diese Aktion kann nicht rückgängig gemacht werden.')}
                        </DrawerDescription>
                      </DrawerHeader>
                      <DrawerFooter>
                        <Button>{t('showcase.submit', 'Absenden')}</Button>
                        <DrawerClose asChild>
                          <Button variant="outline">{t('showcase.cancel', 'Abbrechen')}</Button>
                        </DrawerClose>
                      </DrawerFooter>
                    </DrawerContent>
                  </Drawer>

                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline">{t('showcase.openPopover', 'Popover öffnen')}</Button>
                    </PopoverTrigger>
                    <PopoverContent>
                      <div className="space-y-2">
                        <h4 className="font-medium leading-none">{t('showcase.dimensions', 'Abmessungen')}</h4>
                        <p className="text-sm text-muted-foreground">
                          {t('showcase.setDimensions', 'Legen Sie die Abmessungen für die Ebene fest.')}
                        </p>
                      </div>
                    </PopoverContent>
                  </Popover>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button variant="outline">{t('showcase.hoverMe', 'Bewegen Sie die Maus über mich')}</Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{t('showcase.addToLibrary', 'Zur Bibliothek hinzufügen')}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Menus Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('showcase.menus', 'Menüs')}</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="flex flex-wrap gap-4">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline">{t('showcase.dropdownMenu', 'Dropdown-Menü')}</Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuLabel>{t('showcase.myAccount', 'Mein Konto')}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem>{t('showcase.profile', 'Profil')}</DropdownMenuItem>
                      <DropdownMenuItem>{t('showcase.billing', 'Abrechnung')}</DropdownMenuItem>
                      <DropdownMenuItem>{t('showcase.team', 'Team')}</DropdownMenuItem>
                      <DropdownMenuItem>{t('showcase.subscription', 'Abonnement')}</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>

                  <ContextMenu>
                    <ContextMenuTrigger asChild>
                      <Button variant="outline">{t('showcase.rightClickMe', 'Rechtsklick auf mich')}</Button>
                    </ContextMenuTrigger>
                    <ContextMenuContent>
                      <ContextMenuItem>{t('showcase.profile', 'Profil')}</ContextMenuItem>
                      <ContextMenuItem>{t('showcase.billing', 'Abrechnung')}</ContextMenuItem>
                      <ContextMenuItem>{t('showcase.team', 'Team')}</ContextMenuItem>
                      <ContextMenuItem>{t('showcase.subscription', 'Abonnement')}</ContextMenuItem>
                    </ContextMenuContent>
                  </ContextMenu>

                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <Button variant="outline">{t('showcase.hoverCard', 'Hover-Karte')}</Button>
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold">{t('showcase.nextjs', '@nextjs')}</h4>
                        <p className="text-sm">
                          {t('showcase.reactFramework', 'Das React Framework – erstellt und gepflegt von @vercel.')}
                        </p>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Calendar Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('showcase.calendar', 'Kalender')}</h3>
            <Card>
              <CardContent className="pt-6 flex justify-center">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  className="rounded-md border"
                />
              </CardContent>
            </Card>
          </section>

          {/* Carousel Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('showcase.carousel', 'Karussell')}</h3>
            <Card>
              <CardContent className="pt-6">
                <Carousel className="w-full max-w-xs mx-auto">
                  <CarouselContent>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <CarouselItem key={index}>
                        <div className="p-1">
                          <Card>
                            <CardContent className="flex aspect-square items-center justify-center p-6">
                              <span className="text-4xl font-semibold">
                                {index + 1}
                              </span>
                            </CardContent>
                          </Card>
                        </div>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                  <CarouselPrevious />
                  <CarouselNext />
                </Carousel>
              </CardContent>
            </Card>
          </section>

          {/* Toggle Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('showcase.toggle', 'Umschalter')}</h3>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>{t('showcase.toggle', 'Umschalter')}</Label>
                  <div className="flex gap-2">
                    <Toggle aria-label={t('common.toggleBold', 'Fett umschalten')}>
                      <span className="font-bold">B</span>
                    </Toggle>
                    <Toggle aria-label={t('common.toggleItalic', 'Kursiv umschalten')}>
                      <span className="italic">I</span>
                    </Toggle>
                    <Toggle aria-label={t('common.toggleUnderline', 'Unterstrichen umschalten')}>
                      <span className="underline">U</span>
                    </Toggle>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>{t('showcase.toggleGroup', 'Umschalter-Gruppe')}</Label>
                  <ToggleGroup type="multiple">
                    <ToggleGroupItem value="bold" aria-label={t('common.toggleBold', 'Fett umschalten')}>
                      <span className="font-bold">B</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem value="italic" aria-label={t('common.toggleItalic', 'Kursiv umschalten')}>
                      <span className="italic">I</span>
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="underline"
                      aria-label={t('common.toggleUnderline', 'Unterstrichen umschalten')}
                    >
                      <span className="underline">U</span>
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Aspect Ratio & Scroll Area Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('showcase.layoutComponents', 'Layout-Komponenten')}</h3>
            <Card>
              <CardContent className="pt-6 space-y-6">
                <div className="space-y-2">
                  <Label>{t('showcase.aspectRatio', 'Seitenverhältnis (16/9)')}</Label>
                  <AspectRatio ratio={16 / 9} className="bg-muted">
                    <div className="flex h-full items-center justify-center">
                      <p className="text-muted-foreground">{t('showcase.aspectRatioDesc', '16:9 Seitenverhältnis')}</p>
                    </div>
                  </AspectRatio>
                </div>
                <Separator />
                <div className="space-y-2">
                  <Label>{t('showcase.scrollArea', 'Scrollbereich')}</Label>
                  <ScrollArea className="h-[200px] w-full rounded-md border overflow-hidden">
                    <div className="p-4">
                      <div className="space-y-4">
                        {Array.from({ length: 20 }).map((_, i) => (
                          <div key={i} className="text-sm">
                            {t('showcase.scrollItem', 'Element {{num}}: Dies ist ein scrollbarer Inhaltsbereich', { num: i + 1 })}
                          </div>
                        ))}
                      </div>
                    </div>
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Resizable Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('showcase.resizablePanels', 'Größenveränderbare Panels')}</h3>
            <Card>
              <CardContent className="pt-6">
                <ResizablePanelGroup
                  direction="horizontal"
                  className="min-h-[200px] rounded-lg border"
                >
                  <ResizablePanel defaultSize={50}>
                    <div className="flex h-full items-center justify-center p-6">
                      <span className="font-semibold">{t('showcase.panelOne', 'Panel Eins')}</span>
                    </div>
                  </ResizablePanel>
                  <ResizableHandle />
                  <ResizablePanel defaultSize={50}>
                    <div className="flex h-full items-center justify-center p-6">
                      <span className="font-semibold">{t('showcase.panelTwo', 'Panel Zwei')}</span>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>
              </CardContent>
            </Card>
          </section>

          {/* Toast Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('showcase.toast', 'Toast')}</h3>
            <Card>
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <Label>{t('showcase.sonnerToast', 'Sonner Toast')}</Label>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        sonnerToast.success(t('showcase.operationSuccessful', 'Vorgang erfolgreich'), {
                          description: t('showcase.operationSuccessfulDesc', 'Ihre Änderungen wurden gespeichert'),
                        });
                      }}
                    >
                      {t('showcase.success', 'Erfolg')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        sonnerToast.error(t('showcase.operationFailed', 'Vorgang fehlgeschlagen'), {
                          description: t('showcase.operationFailedDesc', 'Vorgang kann nicht abgeschlossen werden, bitte versuchen Sie es erneut'),
                        });
                      }}
                    >
                      {t('showcase.error', 'Fehler')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        sonnerToast.info(t('showcase.information', 'Information'), {
                          description: t('showcase.informationDesc', 'Dies ist eine Informationsnachricht'),
                        });
                      }}
                    >
                      {t('showcase.information', 'Information')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        sonnerToast.warning(t('showcase.warning', 'Warnung'), {
                          description: t('showcase.warningDesc', 'Bitte beachten Sie die Auswirkungen dieser Operation'),
                        });
                      }}
                    >
                      {t('showcase.warning', 'Warnung')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        sonnerToast.loading(t('showcase.loading', 'Laden'), {
                          description: t('showcase.loadingDesc', 'Bitte warten'),
                        });
                      }}
                    >
                      {t('showcase.loading', 'Laden')}
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        const promise = new Promise(resolve =>
                          setTimeout(resolve, 2000)
                        );
                        sonnerToast.promise(promise, {
                          loading: t('common.processing', 'Wird verarbeitet...'),
                          success: t('common.processingComplete', 'Verarbeitung abgeschlossen!'),
                          error: t('common.processingFailed', 'Verarbeitung fehlgeschlagen'),
                        });
                      }}
                    >
                      {t('common.promise', 'Versprechen')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* AI ChatBox Section */}
          <section className="space-y-4">
            <h3 className="text-2xl font-semibold">{t('showcase.aiChatBox', 'KI-ChatBox')}</h3>
            <Card>
              <CardContent className="pt-6">
                <div className="space-y-4">
                  <div className="text-sm text-muted-foreground">
                    <p>
                      {t('showcase.chatBoxDesc', 'Eine sofort einsatzbereite Chat-Interface-Komponente, die mit dem LLM-System integriert ist. Funktionen: Markdown-Rendering, automatisches Scrollen und Ladezustände.')}
                    </p>
                    <p className="mt-2">
                      {t('showcase.chatBoxDemo', 'Dies ist eine Demo mit simulierten Antworten. In einer echten App würden Sie sie mit einer tRPC-Mutation verbinden.')}
                    </p>
                  </div>
                  <AIChatBox
                    messages={chatMessages}
                    onSendMessage={handleChatSend}
                    isLoading={isChatLoading}
                    placeholder={t('showcase.trySendingMessage', 'Versuchen Sie, eine Nachricht zu senden...')}
                    height="500px"
                    emptyStateMessage={t('showcase.howCanIHelp', 'Wie kann ich Ihnen heute helfen?')}
                    suggestedPrompts={[
                      t('showcase.whatIsReact', 'Was ist React?'),
                      t('showcase.explainTypeScript', 'TypeScript erklären'),
                      t('showcase.howToUseTrpc', 'Wie verwendet man tRPC?'),
                      t('showcase.bestPractices', 'Best Practices für Webentwicklung'),
                    ]}
                  />
                </div>
              </CardContent>
            </Card>
          </section>
        </div>
      </main>

      <footer className="border-t py-6 mt-12">
        <div className="container text-center text-sm text-muted-foreground">
          <p>{t('showcase.footer', 'Shadcn/ui Komponenten-Showcase')}</p>
        </div>
      </footer>
    </div>
  );
}
