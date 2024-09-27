import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
class Country {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column()
  public name!: string;

  @Column()
  public countryCode!: string;

  @Column()
  public dialCode!: string;
}

export default Country;
