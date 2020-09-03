import BN from 'bn.js'

export class WorkingGroupOpening {
  private activateAtBlock: BN | undefined
  private maxActiveApplicants!: BN
  private maxReviewPeriodLength!: BN
  private applicationStakingPolicyAmount!: BN
  private applicationCrowdedOutUnstakingPeriodLength!: BN
  private applicationExpiredUnstakingPeriodLength!: BN
  private roleStakingPolicyAmount!: BN
  private roleCrowdedOutUnstakingPeriodLength!: BN
  private roleExpiredUnstakingPeriodLength!: BN
  private slashableMaxCount!: BN
  private slashableMaxPercentPtsPerTime!: BN
  private successfulApplicantApplicationStakeUnstakingPeriod!: BN
  private failedApplicantApplicationStakeUnstakingPeriod!: BN
  private failedApplicantRoleStakeUnstakingPeriod!: BN
  private terminateApplicationStakeUnstakingPeriod!: BN
  private terminateRoleStakeUnstakingPeriod!: BN
  private exitRoleApplicationStakeUnstakingPeriod!: BN
  private exitRoleStakeUnstakingPeriod!: BN
  private text!: string
  private openingType!: string

  public getActivateAtBlock(): BN | undefined {
    return this.activateAtBlock
  }

  public getMaxActiveApplicants(): BN {
    return this.maxActiveApplicants
  }

  public getMaxReviewPeriodLength(): BN {
    return this.maxReviewPeriodLength
  }

  public getApplicationStakingPolicyAmount(): BN {
    return this.applicationStakingPolicyAmount
  }

  public getApplicationCrowdedOutUnstakingPeriodLength(): BN {
    return this.applicationCrowdedOutUnstakingPeriodLength
  }

  public getApplicationExpiredUnstakingPeriodLength(): BN {
    return this.applicationExpiredUnstakingPeriodLength
  }

  public getRoleStakingPolicyAmount(): BN {
    return this.roleStakingPolicyAmount
  }

  public getRoleCrowdedOutUnstakingPeriodLength(): BN {
    return this.roleCrowdedOutUnstakingPeriodLength
  }

  public getRoleExpiredUnstakingPeriodLength(): BN {
    return this.roleExpiredUnstakingPeriodLength
  }

  public getSlashableMaxCount(): BN {
    return this.slashableMaxCount
  }

  public getSlashableMaxPercentPtsPerTime(): BN {
    return this.slashableMaxPercentPtsPerTime
  }

  public getSuccessfulApplicantApplicationStakeUnstakingPeriod(): BN {
    return this.successfulApplicantApplicationStakeUnstakingPeriod
  }

  public getFailedApplicantApplicationStakeUnstakingPeriod(): BN {
    return this.failedApplicantApplicationStakeUnstakingPeriod
  }

  public getFailedApplicantRoleStakeUnstakingPeriod(): BN {
    return this.failedApplicantRoleStakeUnstakingPeriod
  }

  public getTerminateApplicationStakeUnstakingPeriod(): BN {
    return this.terminateApplicationStakeUnstakingPeriod
  }

  public getTerminateRoleStakeUnstakingPeriod(): BN {
    return this.terminateRoleStakeUnstakingPeriod
  }

  public getExitRoleApplicationStakeUnstakingPeriod(): BN {
    return this.exitRoleApplicationStakeUnstakingPeriod
  }

  public getExitRoleStakeUnstakingPeriod(): BN {
    return this.exitRoleStakeUnstakingPeriod
  }

  public getText(): string {
    return this.text
  }

  public getOpeningType(): string {
    return this.openingType
  }

  public setActivateAtBlock(value: BN | undefined): WorkingGroupOpening {
    this.activateAtBlock = value
    return this
  }

  public setMaxActiveApplicants(value: BN): WorkingGroupOpening {
    this.maxActiveApplicants = value
    return this
  }

  public setMaxReviewPeriodLength(value: BN): WorkingGroupOpening {
    this.maxReviewPeriodLength = value
    return this
  }

  public setApplicationStakingPolicyAmount(value: BN): WorkingGroupOpening {
    this.applicationStakingPolicyAmount = value
    return this
  }

  public setApplicationCrowdedOutUnstakingPeriodLength(value: BN): WorkingGroupOpening {
    this.applicationCrowdedOutUnstakingPeriodLength = value
    return this
  }

  public setApplicationExpiredUnstakingPeriodLength(value: BN): WorkingGroupOpening {
    this.applicationExpiredUnstakingPeriodLength = value
    return this
  }

  public setRoleStakingPolicyAmount(value: BN): WorkingGroupOpening {
    this.roleStakingPolicyAmount = value
    return this
  }

  public setRoleCrowdedOutUnstakingPeriodLength(value: BN): WorkingGroupOpening {
    this.roleCrowdedOutUnstakingPeriodLength = value
    return this
  }

  public setRoleExpiredUnstakingPeriodLength(value: BN): WorkingGroupOpening {
    this.roleExpiredUnstakingPeriodLength = value
    return this
  }

  public setSlashableMaxCount(value: BN): WorkingGroupOpening {
    this.slashableMaxCount = value
    return this
  }

  public setSlashableMaxPercentPtsPerTime(value: BN): WorkingGroupOpening {
    this.slashableMaxPercentPtsPerTime = value
    return this
  }

  public setSuccessfulApplicantApplicationStakeUnstakingPeriod(value: BN): WorkingGroupOpening {
    this.successfulApplicantApplicationStakeUnstakingPeriod = value
    return this
  }

  public setFailedApplicantApplicationStakeUnstakingPeriod(value: BN): WorkingGroupOpening {
    this.failedApplicantApplicationStakeUnstakingPeriod = value
    return this
  }

  public setFailedApplicantRoleStakeUnstakingPeriod(value: BN): WorkingGroupOpening {
    this.failedApplicantRoleStakeUnstakingPeriod = value
    return this
  }

  public setTerminateApplicationStakeUnstakingPeriod(value: BN): WorkingGroupOpening {
    this.terminateApplicationStakeUnstakingPeriod = value
    return this
  }

  public setTerminateRoleStakeUnstakingPeriod(value: BN): WorkingGroupOpening {
    this.terminateRoleStakeUnstakingPeriod = value
    return this
  }

  public setExitRoleApplicationStakeUnstakingPeriod(value: BN): WorkingGroupOpening {
    this.exitRoleApplicationStakeUnstakingPeriod = value
    return this
  }

  public setExitRoleStakeUnstakingPeriod(value: BN): WorkingGroupOpening {
    this.exitRoleStakeUnstakingPeriod = value
    return this
  }

  public setText(value: string): WorkingGroupOpening {
    this.text = value
    return this
  }

  public setOpeningType(value: string): WorkingGroupOpening {
    this.openingType = value
    return this
  }

  constructor() {
    return
  }

  public getActivateAt() {
    return this.activateAtBlock === undefined ? 'CurrentBlock' : { ExactBlock: this.activateAtBlock }
  }

  public getCommitment() {
    return {
      'application_rationing_policy': { 'max_active_applicants': this.maxActiveApplicants },
      'max_review_period_length': this.maxReviewPeriodLength,
      'application_staking_policy': {
        'amount': this.applicationStakingPolicyAmount,
        'amount_mode': 'AtLeast',
        'crowded_out_unstaking_period_length': this.applicationCrowdedOutUnstakingPeriodLength,
        'review_period_expired_unstaking_period_length': this.applicationExpiredUnstakingPeriodLength,
      },
      'role_staking_policy': {
        'amount': this.roleStakingPolicyAmount,
        'amount_mode': 'AtLeast',
        'crowded_out_unstaking_period_length': this.roleCrowdedOutUnstakingPeriodLength,
        'review_period_expired_unstaking_period_length': this.roleExpiredUnstakingPeriodLength,
      },
      'role_slashing_terms': {
        'Slashable': {
          'max_count': this.slashableMaxCount,
          'max_percent_pts_per_time': this.slashableMaxPercentPtsPerTime,
        },
      },
      'fill_opening_successful_applicant_application_stake_unstaking_period': this
        .successfulApplicantApplicationStakeUnstakingPeriod,
      'fill_opening_failed_applicant_application_stake_unstaking_period': this
        .failedApplicantApplicationStakeUnstakingPeriod,
      'fill_opening_failed_applicant_role_stake_unstaking_period': this.failedApplicantRoleStakeUnstakingPeriod,
      'terminate_application_stake_unstaking_period': this.terminateApplicationStakeUnstakingPeriod,
      'terminate_role_stake_unstaking_period': this.terminateRoleStakeUnstakingPeriod,
      'exit_role_application_stake_unstaking_period': this.exitRoleApplicationStakeUnstakingPeriod,
      'exit_role_stake_unstaking_period': this.exitRoleStakeUnstakingPeriod,
    }
  }

  public getAddOpeningParameters(workingGroup: string) {
    return {
      activate_at: this.getActivateAt(),
      commitment: this.getCommitment(),
      human_readable_text: this.getText(),
      working_group: workingGroup,
    }
  }
}
