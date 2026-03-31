import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password?: string; // Hashed password for our custom auth

  @Column({ nullable: true })
  name: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  address: string;

  @Column({ default: false })
  isAdmin: boolean;

  @Column({ nullable: true })
  subCuenta: string;

  @Column({ default: 'no' })
  liberta: string; // 'si' = publica directo; 'no' = a revisión

  @Column({ type: 'jsonb', default: { email: true, sms: false, promotions: true } })
  notifications: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
