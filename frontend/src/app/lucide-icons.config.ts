import { importProvidersFrom } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';
import {
  // Navigation & UI
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  MoreVertical,
  ArrowLeft,
  ArrowRight,
  ExternalLink,

  // Layout
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,

  // Users & People
  User,
  Users,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,

  // Common Actions
  Plus,
  Minus,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Search,
  Filter,
  Settings,
  RefreshCw,
  Save,
  Check,
  XCircle,

  // Status & Feedback
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  HelpCircle,
  Loader2,
  Clock,

  // Communication
  Mail,
  Phone,
  MessageSquare,
  Bell,
  BellOff,

  // Documents
  File,
  FileText,
  FileSpreadsheet,
  Folder,
  FolderOpen,
  Paperclip,

  // Calendar & Time
  Calendar,
  CalendarDays,
  CalendarCheck,
  CalendarX,

  // Finance
  DollarSign,
  CreditCard,
  Wallet,
  Receipt,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,

  // HR & Work
  Briefcase,
  Building2,
  Building,
  GraduationCap,
  Award,

  // Actions & States
  Eye,
  EyeOff,
  Lock,
  Unlock,
  LogIn,
  LogOut,

  // Misc
  Sun,
  Moon,
  Star,
  Heart,
  Home,
  MapPin,
  Globe,
  Link,
  Printer,
  Share2
} from 'lucide-angular';

// Icon set to be used throughout the application
export const icons = {
  // Navigation & UI
  Menu,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  MoreVertical,
  ArrowLeft,
  ArrowRight,
  ExternalLink,

  // Layout
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,

  // Users & People
  User,
  Users,
  UserPlus,
  UserMinus,
  UserCheck,
  UserX,

  // Common Actions
  Plus,
  Minus,
  Edit,
  Trash2,
  Copy,
  Download,
  Upload,
  Search,
  Filter,
  Settings,
  RefreshCw,
  Save,
  Check,
  XCircle,

  // Status & Feedback
  AlertCircle,
  AlertTriangle,
  CheckCircle,
  Info,
  HelpCircle,
  Loader2,
  Clock,

  // Communication
  Mail,
  Phone,
  MessageSquare,
  Bell,
  BellOff,

  // Documents
  File,
  FileText,
  FileSpreadsheet,
  Folder,
  FolderOpen,
  Paperclip,

  // Calendar & Time
  Calendar,
  CalendarDays,
  CalendarCheck,
  CalendarX,

  // Finance
  DollarSign,
  CreditCard,
  Wallet,
  Receipt,
  TrendingUp,
  TrendingDown,
  PieChart,
  BarChart3,

  // HR & Work
  Briefcase,
  Building2,
  Building,
  GraduationCap,
  Award,

  // Actions & States
  Eye,
  EyeOff,
  Lock,
  Unlock,
  LogIn,
  LogOut,

  // Misc
  Sun,
  Moon,
  Star,
  Heart,
  Home,
  MapPin,
  Globe,
  Link,
  Printer,
  Share2
};

export type IconName = keyof typeof icons;

// Provider function for Lucide icons
export function provideLucideIcons(iconSet: typeof icons) {
  return importProvidersFrom(LucideAngularModule.pick(iconSet));
}
