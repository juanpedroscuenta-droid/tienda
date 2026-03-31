import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Category } from '../categories/category.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  cost: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  original_price: number;

  @Column({ nullable: true })
  image: string;

  @Column({ type: 'text', array: true, default: '{}' })
  additional_images: string[];

  @Column({ nullable: true })
  category_name: string;

  @ManyToOne(() => Category, { nullable: true })
  @JoinColumn({ name: 'category_id' })
  category: Category;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ default: false })
  is_published: boolean;

  @Column({ default: false })
  is_offer: boolean;

  @Column({ type: 'int', nullable: true })
  discount: number;

  @Column({ type: 'jsonb', default: '[]' })
  specifications: any;

  @Column({ type: 'jsonb', default: '[]' })
  colors: any;

  @Column({ type: 'text', array: true, default: '{}' })
  benefits: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  warranties: string[];

  @Column({ type: 'text', array: true, default: '{}' })
  payment_methods: string[];

  @Column({ nullable: true })
  created_by: string;

  @Column({ nullable: true })
  last_modified_by: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  profit_margin: number;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
