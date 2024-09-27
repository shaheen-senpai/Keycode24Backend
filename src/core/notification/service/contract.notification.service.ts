import * as entities from 'entities';
import { NotificationInput, NotificationService } from './notification.service';
import UserService from '../../authorization/service/user.service';
import Contract from '../../contract/entity/contract.entity';
import { NotificationType } from '../../../customer-interface/schema/graphql.schema';
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import ContractUser from '../../contract/entity/contract.user.entity';
import { EnableLog } from '../../authorization/logging.decorator';
import User from '../../authorization/entity/user.entity';
import Collaborator from 'src/core/collaboration/entity/collaborator.entity';
import { NotifyEventReminderInput } from '../types/notification.type';
import { dateFormatter } from 'src/common/utils/general.utils';
import { TimeZone } from 'src/core/email/constants/email.constants';
import { concatNames } from '../../../common/utils/string.utils';

@Injectable()
export class ContractNotificationService {
  constructor(
    private notificationService: NotificationService,
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
  ) {}

  /**
   * To notify next recipients about signing a contract
   * @param contract contract which has been shared.
   * @param currentUser current user initiated the action.
   * current user undefined means, share notification to first user
   * TODO - Need following logic changes - if currentUser is undefined, find least order user instaed of 1
   * if currentUser present, find least of next set of users instead of order + 1
   */
  @EnableLog()
  public async notifyNextRecipients(
    contract: Contract,
    nextUsers: ContractUser[] | Collaborator[],
  ) {
    const contractAdmin = await this.userService.getUserByCondition({
      id: contract.createdById,
    });
    const sanitizedUserName = entities.encode(contractAdmin?.fullName || '');
    const sanitizedContractName = entities.encode(contract.name);
    const notificationArray: NotificationInput[] = [];
    nextUsers?.forEach((el) => {
      notificationArray.push({
        userId: el.userId,
        organisationId: contract.organisationId,
        message: `${sanitizedUserName} has shared ${sanitizedContractName} with you for signature.`,
        type: NotificationType.SigningRequired,
        data: this.notificationService.getNotificationData({
          contractId: contract.id,
          contractUserId: el.id,
          packageId: contract.packageId,
        }),
        htmlMessage: `<b>${sanitizedUserName} </b>has shared <b>${sanitizedContractName} </b>with you for signature.`,
      });
    });
    await this.notificationService.addNotification(notificationArray);
    return;
  }

  /**
   * To notify contract admin about declining of contract
   * @param contract contract which has been shared.
   * @param contractAdmin
   * @param currentUser current user initiated the action.
   */
  // Deprecated Use notifyContractDeclinedV2 instead
  @EnableLog()
  public async notifyContractDeclined(
    contract: Contract,
    contractAdmin: User,
    currentUser?: ContractUser | undefined,
  ) {
    if (contractAdmin) {
      const sanitizedUserName = entities.encode(currentUser?.fullName || '');
      const sanitizedContractName = entities.encode(contract.name);
      await this.notificationService.addNotification({
        userId: contractAdmin.id,
        organisationId: contract.organisationId,
        message: `${sanitizedUserName} has rejected the contract '${sanitizedContractName}'`,
        type: NotificationType.SigningDeclined,
        data: this.notificationService.getNotificationData({
          contractId: contract.id,
          contractUserId: currentUser?.id,
        }),
        htmlMessage: `<b>${sanitizedUserName} </b>has rejected the contract <b>${sanitizedContractName} </b>`,
      });
    }
    return;
  }

  /**
   * To notify contract admin about declining of contract
   * @param contract contract which has been shared.
   * @param contractAdmin
   * @param currentUser signer initiated the action.
   */
  @EnableLog()
  public async notifyContractDeclinedV2(
    contract: Contract,
    contractAdmin: User,
    currentUser?: Collaborator | undefined,
  ) {
    if (contractAdmin) {
      const fullName = concatNames(
        currentUser?.firstName || '',
        '',
        currentUser?.lastName || '',
      );
      const sanitizedUserName = entities.encode(fullName);
      const sanitizedContractName = entities.encode(contract.name);
      await this.notificationService.addNotification({
        userId: contractAdmin.id,
        organisationId: contract.organisationId,
        message: `${sanitizedUserName} has rejected the contract '${sanitizedContractName}'`,
        type: NotificationType.SigningDeclined,
        data: this.notificationService.getNotificationData({
          contractId: contract.id,
          contractUserId: currentUser?.id,
        }),
        htmlMessage: `<b>${sanitizedUserName} </b>has rejected the contract <b>${sanitizedContractName} </b>`,
      });
    }
    return;
  }

  /**
   * function to send notification of signer completion to contract creator
   * @param contract
   * @param contractCreator
   * @param currentUser
   * @returns
   */
  // Deprecated use notifySignerCompletionToCreatorV2 instead
  @EnableLog()
  public async notifySignerCompletionToCreator(
    contract: Contract,
    contractCreator: User,
    currentUser?: ContractUser | undefined,
  ) {
    const sanitizedUserName = entities.encode(currentUser?.fullName || '');
    const sanitizedContractName = entities.encode(contract.name);
    await this.notificationService.addNotification({
      userId: contractCreator.id,
      organisationId: contract.organisationId,
      message: `Contract titled ${sanitizedContractName} has been signed by ${sanitizedUserName}.`,
      type: NotificationType.SignerSigningCompleted,
      data: this.notificationService.getNotificationData({
        contractId: contract.id,
      }),
      htmlMessage: `Contract titled <b>${sanitizedContractName} </b> has been signed by <b>${sanitizedUserName}</b>.`,
    });
    return;
  }

  /**
   * function to send notification of signer completion to contract creator
   * @param contract
   * @param contractCreator
   * @param currentUser
   * @returns
   */
  @EnableLog()
  public async notifySignerCompletionToCreatorV2(
    contract: Contract,
    contractCreator: User,
    currentUser?: Collaborator | undefined,
  ) {
    const fullName = concatNames(
      currentUser?.firstName || '',
      '',
      currentUser?.lastName || '',
    );
    const sanitizedUserName = entities.encode(fullName);
    const sanitizedContractName = entities.encode(contract.name);
    await this.notificationService.addNotification({
      userId: contractCreator.id,
      organisationId: contract.organisationId,
      message: `Contract titled ${sanitizedContractName} has been signed by ${sanitizedUserName}.`,
      type: NotificationType.SignerSigningCompleted,
      data: this.notificationService.getNotificationData({
        contractId: contract.id,
      }),
      htmlMessage: `Contract titled <b>${sanitizedContractName} </b> has been signed by <b>${sanitizedUserName}</b>.`,
    });
    return;
  }

  /**
   * To notify contract admin about completion of contract
   * @param contract contract which has been shared.
   */
  @EnableLog()
  public async notifyContractCompleted(contract: Contract) {
    const contractAdmin = await this.userService.getUserByCondition({
      id: contract.createdById,
    });
    if (contractAdmin) {
      const sanitizedContractName = entities.encode(contract.name);
      await this.notificationService.addNotification({
        userId: contractAdmin.id,
        organisationId: contract.organisationId,
        message: `${sanitizedContractName} has been signed by all the Recipients.`,
        type: NotificationType.SigningCompleted,
        data: this.notificationService.getNotificationData({
          contractId: contract.id,
        }),
        htmlMessage: `<b>${sanitizedContractName} </b>has been signed by all the Recipients.`,
      });
    }
    return;
  }

  /**
   * To notify contract admin when a contract gets declined by an approver
   * @param collaborator collaborator with contract and createdBy objects populated.
   */
  @EnableLog()
  public async notifyContractApprovalDeclined(collaborator: Collaborator) {
    const sanitizedContractName = entities.encode(collaborator?.contract.name);
    await this.notificationService.addNotification({
      userId: collaborator.createdById,
      organisationId: collaborator?.contract.organisationId,
      message: `'${sanitizedContractName}' has been rejected by one or more approvers  `,
      type: NotificationType.ApproverDeclined,
      data: this.notificationService.getNotificationData({
        contractId: collaborator?.contractId,
      }),
      htmlMessage: `<b>${sanitizedContractName} </b>has been rejected by one or more approvers  `,
    });
    return;
  }

  /**
   * To notify contract admin when a contract gets approval from all approvers
   * @param contract
   */
  @EnableLog()
  public async notifyContractApprovalsCompleted(contract: Contract) {
    const sanitizedContractName = entities.encode(contract.name);
    await this.notificationService.addNotification({
      userId: contract.createdById,
      organisationId: contract.organisationId,
      message: `${sanitizedContractName} is ready to be sent for signature`,
      type: NotificationType.AllApproversCompleted,
      data: this.notificationService.getNotificationData({
        contractId: contract?.id,
      }),
      htmlMessage: `<b>${sanitizedContractName} </b>is ready to be sent for signature`,
    });
    return;
  }

  /**
   * To notify contract admin once the request receiver submits the template
   * @param contract
   * @param contractDocumentId
   */
  @EnableLog()
  public async notifyRequestTemplateCompleted(
    contract: Contract,
    contractDocumentId: string,
  ) {
    const sanitizedContractName = entities.encode(contract.name);
    await this.notificationService.addNotification({
      userId: contract.createdById,
      organisationId: contract.organisationId,
      message: `Template has been received for ${sanitizedContractName}`,
      type: NotificationType.RequestTemplateCompleted,
      data: this.notificationService.getNotificationData({
        contractId: contract?.id,
        contractDocumentId,
      }),
      htmlMessage: `Template has been received for <b>${sanitizedContractName}</b>`,
    });
    return;
  }

  /**
   * To notify contract admin when all collaborators complete the collaboration process.
   * @param contract
   */
  @EnableLog()
  public async notifyContractCollaborationCompleted(contract: Contract) {
    const sanitizedContent = entities.encode(contract.name);
    await this.notificationService.addNotification({
      userId: contract.createdById,
      organisationId: contract.organisationId,
      message: `Collaboration has been completed for ${sanitizedContent}`,
      type: NotificationType.AllCollaboratorsCompleted,
      data: this.notificationService.getNotificationData({
        contractId: contract?.id,
      }),
      htmlMessage: `Collaboration has been completed for <b>${sanitizedContent}</b>`,
    });
    return;
  }

  /**
   * To notify contract admin when the data capture stage is completed.
   * @param contract
   * @param recipientName
   */
  @EnableLog()
  public async notifyDataCaptureCompleted(
    contract: Contract,
    recipientName: string,
  ) {
    const sanitizedUserName = entities.encode(recipientName);
    const sanitizedContractName = entities.encode(contract.name);
    await this.notificationService.addNotification({
      userId: contract.createdById,
      organisationId: contract.organisationId,
      message: `Counterparty details have been sent by ${sanitizedUserName} for ${sanitizedContractName}`,
      type: NotificationType.DataCaptureCompleted,
      data: this.notificationService.getNotificationData({
        contractId: contract?.id,
      }),
      htmlMessage: `Counterparty details have been sent by <b>${sanitizedUserName} </b>for <b>${sanitizedContractName}</b>`,
    });
    return;
  }

  /**
   * To notify the contract admin about the event reminders
   * @param input
   */
  @EnableLog()
  public async notifyEventReminder(input: NotifyEventReminderInput) {
    const sanitizedContent = entities.encode(input.eventTitle);
    await this.notificationService.addNotification({
      userId: input.userId,
      organisationId: input.organisationId,
      message: `An event titled "${sanitizedContent}" requires your attention before ${dateFormatter(
        input.dueDate,
        TimeZone,
        'en-GB',
      )}`,
      type: NotificationType.EventReminder,
      data: this.notificationService.getNotificationData({
        eventId: input.eventId,
      }),
      htmlMessage: `An event titled <b>${sanitizedContent} </b>requires your attention before <b>${dateFormatter(
        input.dueDate,
        TimeZone,
        'en-GB',
      )}</b>`,
    });
    return;
  }
}
