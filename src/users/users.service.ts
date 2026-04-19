import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { User } from './entities/user.entity';
import { UsersRepository } from './users.repository';

@Injectable()
export class UsersService {
  constructor(
    private readonly usersRepository: UsersRepository,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findByEmail(email);
  }

  async findById(id: string): Promise<User | null> {
    const cacheKey = `user:${id}`;

    const cached = await this.cacheManager.get<User>(cacheKey);
    if (cached) {
      return cached;
    }

    const user = await this.usersRepository.findById(id);
    if (user) {
      await this.cacheManager.set(cacheKey, user, 300000); // cache 5 นาที
    }
    return user;
  }

  async create(data: Partial<User>): Promise<User> {
    return this.usersRepository.create(data);
  }
}
