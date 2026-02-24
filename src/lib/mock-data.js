// Central mock data source.
// Replace these structures with real API responses later.

const now = new Date();

function isoDaysFromNow(days) {
  const d = new Date(now);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export const PACKAGE_TYPES = {
  STANDARD: 'STANDARD',
  FULL_DLC: 'FULL_DLC',
  FULL_INAPP: 'FULL_INAPP',
};

export const PLANS = [
  {
    id: 'plan_standard_30d',
    name: 'Standard Access (30 days)',
    packageType: PACKAGE_TYPES.STANDARD,
    monthlyQuota: 30,
    notes: ['Basic access with standard usage limits.'],
  },
  {
    id: 'plan_full_dlc_30d',
    name: 'Full DLC Access (30 days)',
    packageType: PACKAGE_TYPES.FULL_DLC,
    monthlyQuota: 30,
    notes: ['Includes DLC download entitlement.', 'Requires special activation steps after download.'],
  },
  {
    id: 'plan_full_inapp_30d',
    name: 'Full In-App Access (30 days)',
    packageType: PACKAGE_TYPES.FULL_INAPP,
    monthlyQuota: 30,
    notes: ['Includes in-app items (where applicable).', 'Requires special verification steps.'],
  },
];

const FAQ_COMMON = [
  {
    id: 'faq_reveal',
    q: 'When should I reveal the password?',
    a: 'Only reveal when you are ready to sign in. Avoid repeated reveals on multiple devices.',
  },
  {
    id: 'faq_limits',
    q: 'Why do I have a quota?',
    a: 'Quota is used to manage access fairness and reduce lockouts. Your remaining quota is shown on the app page.',
  },
  {
    id: 'faq_reset',
    q: 'When does monthly quota reset?',
    a: 'Monthly quota resets on a monthly cycle (mock logic here). Your provider will define the actual reset rules.',
  },
];

const APPS = [
  {
    id: 'app_deadcells',
    slug: 'deadcells',
    name: 'Dead Cells',
    packageType: PACKAGE_TYPES.FULL_DLC,
    description:
      'Rental access portal for Dead Cells. Includes special handling for DLC activation after download (mock).',
    subscription: {
      status: 'ACTIVE', // ACTIVE | PAUSED | EXPIRED (mock)
      planId: 'plan_full_dlc_30d',
      quotaTotal: 120,
      quotaRemainingTotal: 84,
      monthlyUsed: 12,
      monthlyRemaining: 18,
      expiresAt: isoDaysFromNow(22),
    },
    credentials: {
      status: 'READY', // READY | LOCKED | COOLDOWN (mock)
      accountEmail: 'rent.deadcells.001@icloud.example',
      password: 'MockPass#Deadcells-001',
      lastRevealedAt: isoDaysFromNow(-1),
      cooldownMinutes: 10,
      notes: ['Do not enable Find My on this account.', 'Do not change the password.'],
    },
    faq: [
      ...FAQ_COMMON,
      {
        id: 'faq_dlc',
        q: 'Do I need to do anything after downloading DLC?',
        a: 'Yes. Open the app once to ensure DLC content is recognized, then you may sign out (package-specific).',
      },
    ],
    guide: {
      steps: [
        'Open Settings → App Store → Sign Out (if currently signed in).',
        'Sign in using the provided App Store ID account and password.',
        'Download the app and any required content.',
        'Open the app once to verify it launches and content is present.',
        'After verification, sign out to avoid unintended syncing.',
      ],
      notes: [
        'Avoid signing in on multiple devices simultaneously.',
        'If you see a cooldown status, wait before trying again.',
      ],
    },
  },
  {
    id: 'app_stardew',
    slug: 'stardewvalley',
    name: 'Stardew Valley',
    packageType: PACKAGE_TYPES.STANDARD,
    description: 'Standard rental access portal for Stardew Valley (mock).',
    subscription: {
      status: 'ACTIVE',
      planId: 'plan_standard_30d',
      quotaTotal: 60,
      quotaRemainingTotal: 44,
      monthlyUsed: 6,
      monthlyRemaining: 24,
      expiresAt: isoDaysFromNow(10),
    },
    credentials: {
      status: 'READY',
      accountEmail: 'rent.stardew.014@icloud.example',
      password: 'MockPass#Stardew-014',
      lastRevealedAt: isoDaysFromNow(-3),
      cooldownMinutes: 5,
      notes: ['Do not modify account security settings.', 'Use only for download/restore and sign out afterwards.'],
    },
    faq: FAQ_COMMON,
    guide: {
      steps: [
        'Sign out of any existing App Store account on your device.',
        'Sign in using the provided App Store ID credentials.',
        'Download the app from the App Store.',
        'Launch the app once to confirm it works, then sign out.',
      ],
      notes: ['If you cannot sign in, wait a few minutes and try again (cooldown may apply).'],
    },
  },
];

export function getAllApps() {
  return APPS.map((a) => ({ id: a.id, slug: a.slug, name: a.name, packageType: a.packageType }));
}

export function getAllAppsPublic() {
  // Public list view model (no credentials).
  return APPS.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    packageType: a.packageType,
    subscription: {
      status: a.subscription.status,
      expiresAt: a.subscription.expiresAt,
    },
  }));
}

export function getAppBySlug(slug) {
  const key = String(slug || '').toLowerCase();
  const app = APPS.find((a) => a.slug === key);
  if (!app) return null;

  // Example subscription view model (future API shape). Keep stable for UI usage.
  return {
    ...app,
    plan: PLANS.find((p) => p.id === app.subscription.planId) || null,
  };
}

export function isSpecialPackageType(packageType) {
  return packageType === PACKAGE_TYPES.FULL_DLC || packageType === PACKAGE_TYPES.FULL_INAPP;
}