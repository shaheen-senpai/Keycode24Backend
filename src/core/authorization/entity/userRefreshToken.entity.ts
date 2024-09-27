import { Column, Entity, Index, PrimaryColumn } from 'typeorm';

@Entity()
class UserRefreshToken {
  @PrimaryColumn('uuid')
  public id!: string;

  @Column()
  public refreshToken!: string;

  @Index('user_refresh_token_user_id_idx')
  @Column()
  public userId!: string;

  @Column({ nullable: true })
  public deviceId?: string;
}

export default UserRefreshToken;
