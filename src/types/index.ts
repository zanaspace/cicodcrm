/**
 * Domain types used across services, hooks and screens. They currently live next to the mock data that
 * produces them; once the backend contracts are confirmed, define the backend payload types here and map
 * them in the services.
 */
export type { Customer, CustomerStatus, Contact, ActivityItem, Subscription, Lifecycle, Health } from "@/lib/mock/customers";
export type { Plan, Bundle, BundleGroup, Feature, Price, Product, Currency } from "@/lib/mock/catalogue";
export type { Payment, PaymentMethod, DunningPolicy, DunningState, Pause } from "@/lib/mock/billing";
export type { Lead, LeadActivity, PipelineStage, StageId, Subscriber, Partner, PartnerStatus, CommissionPlan, Campaign } from "@/lib/mock/growth";
export type { Template } from "@/lib/mock/messaging";
export type { User, UserStatus, Role, AuditEntry, ApiKey, NotificationRule, Sector, Country, CurrencySetting, PaymentMethodSetting } from "@/lib/mock/settings";
export type { SessionUser } from "@/lib/auth/session";
export type { Access, AccessMap, ModuleId } from "@/lib/permissions/model";
