export class AccountCreatedEvent { constructor(public readonly userId: string) {} }
export class JobApplyClickedNoConfirmEvent { constructor(public readonly userId: string, public readonly jobId: string) {} }
export class NewJobPostedNearZipEvent { constructor(public readonly userId: string, public readonly jobId: string) {} }
export class IntakeCompleteEvent { constructor(public readonly userId: string) {} }
export class ReactivatedUserLoginEvent { constructor(public readonly userId: string) {} } 