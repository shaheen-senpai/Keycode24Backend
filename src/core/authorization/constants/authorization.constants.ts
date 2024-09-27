import { TokenType } from '../../authentication/constants/authentication.constants';

export enum UserType {
  Student = 'student',
  Teacher = 'teacher',
  Parent = 'parent',
}

export enum PermissionsType {
  CreateEntities = 'create-entities',
  EditEntities = 'edit-entities',
  ViewEntities = 'view-entities',
  DeleteEntities = 'delete-entities',
  CreateGroups = 'create-groups',
  EditGroups = 'edit-groups',
  ViewGroups = 'view-groups',
  DeleteGroups = 'delete-groups',
  CreatePermissions = 'create-permissions',
  EditPermissions = 'edit-permissions',
  ViewPermissions = 'view-permissions',
  DeletePermissions = 'delete-permissions',
  CreateUser = 'create-user',
  EditUser = 'edit-user',
  ViewUser = 'view-user',
  CustomerCreateUserGroupOwner = 'C:C-user-group-owner',
  DeleteUser = 'delete-user',

  // Customer permissions - V3
  CustomerViewOrganization = 'C:V-organization',
  CustomerEditOrganization = 'C:E-organization',
  CustomerEditMFA = 'C:E-mfa',
  CustomerViewUsers = 'C:V-users',
  CustomerCreateUsers = 'C:C-users',
  CustomerEditUsers = 'C:E-users',
  CustomerDeleteUsers = 'C:D-users',
  CustomerActivateUsers = 'C:activate-users',
  CustomerCreateSubscription = 'C:C-subscription',
  CustomerViewSubscription = 'C:V-subscription',
  CustomerCancelSubscription = 'C:cancel-subscription',
  CustomerViewPaymentCard = 'C:V-payment-card',
  CustomerCreatePaymentCard = 'C:C-payment-card',
  CustomerDeletePaymentCard = 'C:D-payment-card',
  CustomerViewBrand = 'C:V-brand',
  CustomerCreateBrand = 'C:C-brand',
  CustomerEditBrand = 'C:E-brand',
  CustomerDeleteBrand = 'C:D-brand',
  // Marketplace
  CustomerViewMarketplace = 'C:V-marketplace',
  CustomerDownloadMarketplace = 'C:download-marketplace',
  // Library
  CustomerViewMyTemplate = 'C:V-my-template',
  CustomerViewAllTemplate = 'C:V-all-template',
  CustomerCreateMyTemplateLimit1 = 'C:C-template-L1',
  CustomerCreateMyTemplateLimit2 = 'C:C-template-L2',
  CustomerCreateMyTemplateLimitLast = 'C:C-template-Llast',
  CustomerEditMyTemplate = 'C:E-my-template',
  CustomerDeleteMyTemplate = 'C:D-my-template',
  CustomerEditAllTemplate = 'C:E-all-template',
  CustomerDeleteAllTemplate = 'C:D-all-template',
  CustomerCreateClauseLimit1 = 'C:C-clause-L1',
  CustomerCreateClauseLimit2 = 'C:C-clause-L2',
  CustomerCreateClauseLimitLast = 'C:C-clause-Llast',
  CustomerEditMyClause = 'C:E-my-clause',
  CustomerViewMyClause = 'C:V-my-clause',
  CustomerDeleteMyClause = 'C:D-my-clause',
  CustomerEditAllClause = 'C:E-all-clause',
  CustomerViewAllClause = 'C:V-all-clause',
  CustomerDeleteAllClause = 'C:D-all-clause',
  // Contracts
  CustomerCreateContractUpload = 'C:C-contract-upload',
  CustomerCreateContractTemplate = 'C:C-contract-template',
  CustomerCreateContractLimit1 = 'C:C-contract-L1',
  CustomerCreateContractLimit2 = 'C:C-contract-L2',
  CustomerCreateContractLimit3 = 'C:C-contract-L3',
  CustomerCreateContractLimitLast = 'C:C-contract-Llast',
  CustomerViewMyContract = 'C:V-my-contract',
  CustomerEditMyContract = 'C:E-my-contract',
  CustomerDeleteMyContract = 'C:D-my-contract',
  CustomerViewAllContract = 'C:V-all-contract',
  CustomerEditAllContract = 'C:E-all-contract',
  CustomerDeleteAllContract = 'C:D-all-contract',
  CustomerDownloadMyContract = 'C:download-my-contract',
  CustomerDownloadAllContract = 'C:download-all-contract',
  CustomerAddContractToEvent = 'C:add-contract-to-event',
  CustomerGenerateMyContractSummary = 'C:generate-my-contract-summary',
  CustomerGenerateAllContractSummary = 'C:generate-all-contract-summary',
  CustomerCreateContractUseWorkflow = 'C:C-contract-use-workflow',
  CustomerSendForSignatureMyContract = 'C:sendforsignature-my-contract', // New Permission
  CustomerSendForSignatureAllContract = 'C:sendforsignature-all-contract', // New Permission
  // Migrate with AI
  CustomerCreateContractStorage = 'C:C-contract-storage', // New Permission
  CustomerViewMyContractStorage = 'C:V-my-contract-storage', // New Permission
  CustomerViewAllContractStorage = 'C:V-all-contract-storage', // New Permission
  CustomerDeleteMyContractStorage = 'C:D-my-contract-storage', // New Permission
  CustomerDeleteAllContractStorage = 'C:D-all-contract-storage', // New Permission
  // Extraction
  CustomerViewCbExtraction = 'C:V-extraction',
  CustomerCreateMyContractExtraction = 'C:C-my-contract-extraction',
  CustomerCreateAllContractExtraction = 'C:C-all-contract-extraction',
  CustomerCreateContractExtractionLimit1 = 'C:C-contract-extraction-L1',
  CustomerCreateContractExtractionLimitLast = 'C:C-contract-extraction-Llast',
  // Collaborations
  CustomerViewMyContractCollaboration = 'C:V-my-contract-collaboration',
  CustomerCreateMyContractCollaboration = 'C:C-my-contract-collaboration',
  CustomerEditMyContractCollaboration = 'C:E-my-contract-collaboration',
  CustomerDeleteMyContractCollaboration = 'C:D-my-contract-collaboration',
  CustomerViewAllContractCollaboration = 'C:V-all-contract-collaboration',
  CustomerCreateAllContractCollaboration = 'C:C-all-contract-collaboration',
  CustomerEditAllContractCollaboration = 'C:E-all-contract-collaboration',
  CustomerDeleteAllContractCollaboration = 'C:D-all-contract-collaboration',
  CustomerViewMyContractApproval = 'C:V-my-contract-approval',
  CustomerCreateMyContractApproval = 'C:C-my-contract-approval',
  CustomerEditMyContractApproval = 'C:E-my-contract-approval',
  CustomerDeleteMyContractApproval = 'C:D-my-contract-approval',
  CustomerViewAllContractApproval = 'C:V-all-contract-approval',
  CustomerCreateAllContractApproval = 'C:C-all-contract-approval',
  CustomerEditAllContractApproval = 'C:E-all-contract-approval',
  CustomerDeleteAllContractApproval = 'C:D-all-contract-approval',
  CustomerViewMyContractDataCapture = 'C:V-my-contract-data-capture',
  CustomerCreateMyContractDataCapture = 'C:C-my-contract-data-capture',
  CustomerEditMyContractDataCapture = 'C:E-my-contract-data-capture',
  CustomerDeleteMyContractDataCapture = 'C:D-my-contract-data-capture',
  CustomerViewAllContractDataCapture = 'C:V-all-contract-data-capture',
  CustomerCreateAllContractDataCapture = 'C:C-all-contract-data-capture',
  CustomerEditAllContractDataCapture = 'C:E-all-contract-data-capture',
  CustomerDeleteAllContractDataCapture = 'C:D-all-contract-data-capture',
  CustomerViewMyContractRule = 'C:V-my-contract-rule',
  CustomerCreateMyContractRule = 'C:C-my-contract-rule',
  CustomerEditMyContractRule = 'C:E-my-contract-rule',
  CustomerDeleteMyContractRule = 'C:D-my-contract-rule',
  CustomerViewAllContractRule = 'C:V-all-contract-rule',
  CustomerCreateAllContractRule = 'C:C-all-contract-rule',
  CustomerEditAllContractRule = 'C:E-all-contract-rule',
  CustomerDeleteAllContractRule = 'C:D-all-contract-rule',
  // Integrations
  CustomerViewMergeIntegration = 'C:V-merge-integration',
  CustomerCreateMergeIntegrationLimit1 = 'C:C-merge-integration-L1',
  CustomerCreateMergeIntegrationLimitLast = 'C:C-merge-integration-Llast',
  CustomerDeleteMergeIntegration = 'C:D-merge-integration',
  CustomerViewGoogleCalendarIntegration = 'C:V-google-calendar-integration',
  CustomerCreateGoogleCalendarIntegration = 'C:C-google-calendar-integration',
  CustomerEditGoogleCalendarIntegration = 'C:E-google-calendar-integration',
  //Workflow
  CustomerCreateWorkflow = 'C:C-workflow',
  CustomerViewWorkflow = 'C:V-workflow',
  CustomerUseWorkflow = 'C:use-workflow',
  //Folder
  CustomerCreateFolder = 'C:create-folder',
  CustomerEditFolder = 'C:edit-folder',
  CustomerViewFolder = 'C:view-folder',
  CustomerDeleteFolder = 'C:delete-folder',
  //Events
  CustomerCreateEvent = 'C:C-event',
  CustomerEditEvent = 'C:E-event',
  CustomerViewEvent = 'C:V-event',
  CustomerDeleteEvent = 'C:D-event',
  // Share Contract
  CustomerViewAllShare = 'C:V-all-contract-share',
  CustomerCreateAllShare = 'C:C-all-contract-share',
  CustomerDeleteAllShare = 'C:D-all-contract-share',
  CustomerViewMyShare = 'C:V-my-share',
  CustomerCreateMyShare = 'C:C-my-share',
  CustomerDeleteMyShare = 'C:D-my-share',
  // Questionaire
  CustomerViewMyTemplateQuestionnaire = 'C:V-my-template-qsnaire',
  CustomerCreateMyTemplateQuestionnaire = 'C:C-my-template-qsnaire',
  CustomerEditMyTemplateQuestionnaire = 'C:E-my-template-qsnaire',
  CustomerDeleteMyTemplateQuestionnaire = 'C:D-my-template-qsnaire',
  CustomerViewAllTemplateQuestionnaire = 'C:V-all-template-qsnaire',
  CustomerCreateAllTemplateQuestionnaire = 'C:C-all-template-qsnaire',
  CustomerEditAllTemplateQuestionnaire = 'C:E-all-template-qsnaire',
  CustomerDeleteAllTemplateQuestionnaire = 'C:D-all-template-qsnaire',
  // Task
  CustomerCreateTask = 'C:C-task',
  CustomerEditTask = 'C:E-task',
  CustomerViewTask = 'C:V-task',
  CustomerDeleteTask = 'C:D-task',
  // Contract Property
  CustomerEditMyContractProperty = 'C:E-my-contract-property',
  CustomerEditAllContractProperty = 'C:E-all-contract-property',

  // Customer permissions
  CustomerCreateOrganization = 'C:create-organization',
  CustomerDeleteOrganization = 'C:delete-organization',
  CustomerCreateUserGroupContractAdmin = 'C:create-user-group-contract-admin',
  CustomerCreateUserGroupMember = 'C:create-user-group-member',
  CustomerEditSubscription = 'C:edit-subscription',
  CustomerViewMyProfile = 'C:view-my-profile',
  CustomerEditMyProfile = 'C:edit-my-profile',
  CustomerCreateContractQuicksend = 'C:create-contract-quicksend',
  CustomerCreateRequestContract = 'C:create-request-contract',
  CustomerCreateMultiContract = 'C:create-multi-contract',
  CustomerSendMyContractUpload = 'C:send-my-contract-upload',
  CustomerSendMyContractTemplate = 'C:send-my-contract-template',
  CustomerSendAllContractUpload = 'C:send-all-contract-upload',
  CustomerSendAllContractTemplate = 'C:send-all-contract-template',
  CustomerCreateLegacyContract = 'C:create-legacy-contract',
  CustomerViewAllLegacyContract = 'C:view-all-legacy-contract',
  CustomerViewMyLegacyContract = 'C:view-my-legacy-contract',
  CustomerDeleteAllLegacyContract = 'C:delete-all-legacy-contract',
  CustomerDeleteMyLegacyContract = 'C:delete-my-legacy-contract',
  CustomerViewMyContractReminder = 'C:view-my-contract-reminder',
  CustomerCreateMyContractReminder = 'C:create-my-contract-reminder',
  CustomerEditMyContractReminder = 'C:edit-my-contract-reminder',
  CustomerDeleteMyContractReminder = 'C:delete-my-contract-reminder',
  CustomerViewAllContractReminder = 'C:view-all-contract-reminder',
  CustomerCreateAllContractReminder = 'C:create-all-contract-reminder',
  CustomerEditAllContractReminder = 'C:edit-all-contract-reminder',
  CustomerDeleteAllContractReminder = 'C:delete-all-contract-reminder',
  CustomerEditMyLegacyContract = 'C:edit-my-legacy-contract',
  CustomerEditAllLegacyContract = 'C:edit-all-legacy-contract',
  CustomerViewReportByUsers = 'C:view-report-by-users',
  CustomerViewReportByType = 'C:view-report-by-type',
  CustomerViewReportByStatus = 'C:view-report-by-status',
  CustomerViewTerminatingContracts = 'C:view-terminating-contracts',
  CustomerViewUpcomingRenewals = 'C:view-upcoming-renewals',
  CustomerCreateAllRecommendation = 'C:create-all-recommendation',
  CustomerCreateMyRecommendation = 'C:create-my-recommendation',
  CustomerGetAllRecommendation = 'C:get-all-recommendation',
  CustomerGetMyRecommendation = 'C:get-my-recommendation',
}

export enum GroupType {
  Admin = 'Admin',
}

export enum CustomerGroupType {
  Owner = 'Owner',
  Administrator = 'Administrator',
  Creator = 'Creator',
  Signer = 'Signer',
  Viewer = 'Viewer',
  // Deprecation Start
  AccountAdmin = 'Account Admin',
  ContractAdmin = 'Contract Admin',
  AuthorizedSignatory = 'Authorized Signatory',
  Member = 'Member',
  // Deprecation End
}

export enum PlanItemType {
  FreePlan = 'free-plan',
  EssentialPlanUSDMonthly = 'essential-plan-USD-Monthly',
  EssentialPlanUSDYearly = 'essential-plan-USD-Yearly',
  BusinessPlanUSDMonthly = 'business-plan-USD-Monthly',
  BusinessPlanUSDYearly = 'business-plan-USD-Yearly',
}

export const DefaultCustomerPermissions = [
  PermissionsType.CustomerViewMyProfile,
  PermissionsType.CustomerEditMyProfile,
];

export interface AccessTokenData {
  username: string;
  sub: string;
  id: string;
  env: string;
  tokenType: TokenType;
  userType: UserType;
  inTrial?: boolean;
  organisation: {
    id: string;
  };
  matchedPermissions?: string[]; // user permissions those allows to access the service.
  share?: {
    matchedSharePermissions: string[];
    contractId: string;
  }; // user share permissions those allows to access the service.
}

export const createUserGroupPermissions = [
  PermissionsType.CustomerCreateUserGroupOwner,
  PermissionsType.CustomerCreateUserGroupContractAdmin,
  PermissionsType.CustomerCreateUserGroupMember,
];

export interface ILimitDuration {
  value: number;
  unit: string;
}

export const LimitDuration = {
  Monthly: {
    value: 1,
    unit: 'months',
  },
  Yearly: {
    value: 1,
    unit: 'years',
  },
  Lifetime: {
    value: Infinity, // Sufficiently Large Value
    unit: 'months',
  },
};

export const permissionsWithLimit: Record<
  string,
  { permission: string; limit: number; limitDuration: ILimitDuration }[]
> = {
  Template: [
    {
      permission: PermissionsType.CustomerCreateMyTemplateLimit1,
      limit: 3,
      limitDuration: LimitDuration.Monthly,
    },
    {
      permission: PermissionsType.CustomerCreateMyTemplateLimit2,
      limit: 10,
      limitDuration: LimitDuration.Monthly,
    },
    {
      permission: PermissionsType.CustomerCreateMyTemplateLimitLast,
      limit: Infinity,
      limitDuration: LimitDuration.Monthly,
    },
  ],

  Clause: [
    {
      permission: PermissionsType.CustomerCreateClauseLimit1,
      limit: 10,
      limitDuration: LimitDuration.Monthly,
    },
    {
      permission: PermissionsType.CustomerCreateClauseLimit2,
      limit: 30,
      limitDuration: LimitDuration.Monthly,
    },
    {
      permission: PermissionsType.CustomerCreateClauseLimitLast,
      limit: Infinity,
      limitDuration: LimitDuration.Monthly,
    },
  ],
  Contract: [
    {
      permission: PermissionsType.CustomerCreateContractLimit1,
      limit: 2,
      limitDuration: LimitDuration.Monthly,
    },
    {
      permission: PermissionsType.CustomerCreateContractLimit2,
      limit: 200,
      limitDuration: LimitDuration.Monthly,
    },
    {
      permission: PermissionsType.CustomerCreateContractLimit3,
      limit: 200,
      limitDuration: LimitDuration.Monthly,
    },
    {
      permission: PermissionsType.CustomerCreateContractLimitLast,
      limit: 200,
      limitDuration: LimitDuration.Monthly,
    },
  ],
  DocumentExtraction: [
    {
      permission: PermissionsType.CustomerCreateContractExtractionLimit1,
      limit: 1,
      limitDuration: LimitDuration.Monthly,
    },
    {
      permission: PermissionsType.CustomerCreateContractExtractionLimitLast,
      limit: Infinity,
      limitDuration: LimitDuration.Monthly,
    },
  ],
  Integration: [
    {
      permission: PermissionsType.CustomerCreateMergeIntegrationLimit1,
      limit: 1,
      limitDuration: LimitDuration.Lifetime,
    },
    {
      permission: PermissionsType.CustomerCreateMergeIntegrationLimitLast,
      limit: Infinity,
      limitDuration: LimitDuration.Lifetime,
    },
  ],
};

export const permissionsWithLimitForDev: Record<
  string,
  { permission: string; limit: number; limitDuration: ILimitDuration }[]
> = {
  Template: [
    {
      permission: PermissionsType.CustomerCreateMyTemplateLimit1,
      limit: 3,
      limitDuration: LimitDuration.Monthly,
    },
    {
      permission: PermissionsType.CustomerCreateMyTemplateLimit2,
      limit: 10,
      limitDuration: LimitDuration.Monthly,
    },
    {
      permission: PermissionsType.CustomerCreateMyTemplateLimitLast,
      limit: Infinity,
      limitDuration: LimitDuration.Monthly,
    },
  ],

  Clause: [
    {
      permission: PermissionsType.CustomerCreateClauseLimit1,
      limit: 10,
      limitDuration: LimitDuration.Monthly,
    },
    {
      permission: PermissionsType.CustomerCreateClauseLimit2,
      limit: 12,
      limitDuration: LimitDuration.Monthly,
    },
    {
      permission: PermissionsType.CustomerCreateClauseLimitLast,
      limit: Infinity,
      limitDuration: LimitDuration.Monthly,
    },
  ],
  Contract: [
    {
      permission: PermissionsType.CustomerCreateContractLimit1,
      limit: 2,
      limitDuration: LimitDuration.Monthly,
    },
    {
      permission: PermissionsType.CustomerCreateContractLimit2,
      limit: 3,
      limitDuration: LimitDuration.Monthly,
    },
    {
      permission: PermissionsType.CustomerCreateContractLimit3,
      limit: 5,
      limitDuration: LimitDuration.Monthly,
    },
    {
      permission: PermissionsType.CustomerCreateContractLimitLast,
      limit: 10,
      limitDuration: LimitDuration.Monthly,
    },
  ],
  DocumentExtraction: [
    {
      permission: PermissionsType.CustomerCreateContractExtractionLimit1,
      limit: 1,
      limitDuration: LimitDuration.Monthly,
    },
    {
      permission: PermissionsType.CustomerCreateContractExtractionLimitLast,
      limit: Infinity,
      limitDuration: LimitDuration.Monthly,
    },
  ],
  Integration: [
    {
      permission: PermissionsType.CustomerCreateMergeIntegrationLimit1,
      limit: 1,
      limitDuration: LimitDuration.Lifetime,
    },
    {
      permission: PermissionsType.CustomerCreateMergeIntegrationLimitLast,
      limit: Infinity,
      limitDuration: LimitDuration.Lifetime,
    },
  ],
};

export const ORGANISATION_KEY = 'ORG_KEY:';
export const USER_KEY = 'USER_KEY:';
