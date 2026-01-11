import { IQuery, QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import type { ITransactionRepository, FindTransactionsOptions } from '../../domain';
import { TRANSACTION_REPOSITORY } from '../../domain';
import { TransactionMapper } from '../mappers';
import { PaginatedTransactionsResponseDto } from '../dto';

export class ListTransactionsQuery implements IQuery {
  constructor(public readonly options: FindTransactionsOptions) {}
}

@QueryHandler(ListTransactionsQuery)
export class ListTransactionsHandler implements IQueryHandler<ListTransactionsQuery> {
  constructor(
    @Inject(TRANSACTION_REPOSITORY)
    private readonly transactionRepository: ITransactionRepository,
  ) {}

  async execute(query: ListTransactionsQuery): Promise<PaginatedTransactionsResponseDto> {
    const result = await this.transactionRepository.findAll(query.options);

    return {
      data: result.data.map((record) => TransactionMapper.toDto(record)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      pages: result.pages,
    };
  }
}
