import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityNotFoundError, Repository } from 'typeorm';
import { GeneralApplicationException } from '../../../common/exception/general.application.exception';
import StateNonce from '../entity/state.nonce.entity';

@Injectable()
export class StateNonceService {
  constructor(
    @InjectRepository(StateNonce)
    private stateNonceRepository: Repository<StateNonce>,
  ) {}

  /**
   * To get stateNonce by state
   * @param state
   * @returns StateNonce
   */
  async findOneByState(state: string) {
    const obj = await this.stateNonceRepository.findOneBy({ state });
    if (!obj) {
      throw new EntityNotFoundError(StateNonce, state);
    }
    return obj;
  }

  /**
   * Checks if the state of the stateNonceObj is already validated.
   * @returns true if the state is valid.
   */
  async validateState(stateNonceObj: StateNonce): Promise<boolean> {
    if (stateNonceObj.isStateValidated) {
      throw new GeneralApplicationException('State is already validated');
    }
    stateNonceObj.isStateValidated = true;
    return true;
  }

  /**
   * Checks the given nonce with the nonce in the stateNonceObj.
   * @returns true if the nonce is valid.
   */
  async validateNonce(
    stateNonceObj: StateNonce,
    nonce: string,
  ): Promise<boolean> {
    if (stateNonceObj.isNonceValidated) {
      throw new GeneralApplicationException('Nonce is already validated');
    }
    if (stateNonceObj.nonce !== nonce) {
      throw new GeneralApplicationException('Invalid nonce');
    }
    return (stateNonceObj.isNonceValidated = true);
  }

  /**
   * To save stateNonce
   * @param stateNonceObj
   */
  async save(stateNonceObj: StateNonce) {
    await this.stateNonceRepository.save(stateNonceObj);
  }
}
