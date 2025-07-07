import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable, OneToMany, CreateDateColumn, UpdateDateColumn, RelationId, } from 'typeorm';
import { User } from './user.entity';
import { Person } from './person.entity';

@Entity('population')
export class Population {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @ManyToOne(() => User, (user) => user.populations, { onDelete: 'CASCADE' })
  user: User;

  @RelationId((population:Population)=>population.user)
  userId:string;

  @ManyToOne(() => Population, (p) => p.children, { nullable: true, onDelete: 'CASCADE' })
  parentPopulation?: Population;

  @OneToMany(() => Population, (p) => p.parentPopulation)
  children: Population[];

  @ManyToMany(() => Person, (person) => person.populations, { cascade: true })
  @JoinTable({
    name: 'person_population',
    joinColumn: { name: 'populationId', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'personId', referencedColumnName: 'id' },
  })
  persons: Person[];

  @Column({ type: 'enum', enum: ['completed', 'queued', 'working', 'failed'], default: 'queued' })
  status: 'completed' | 'queued' | 'working' | 'failed';

  @Column({type:"uuid", nullable: true })
  jobId:string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // @Column({type:"number", nullable:true})
  // total:number;
}
