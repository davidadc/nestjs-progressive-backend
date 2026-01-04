import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { AddressService } from '../../application/services/address.service';
import {
  CreateAddressDto,
  UpdateAddressDto,
  AddressResponseDto,
} from '../../application/dto/address.dto';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';

@ApiTags('Addresses')
@ApiBearerAuth()
@Controller('users/me/addresses')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  @Get()
  @ApiOperation({ summary: 'List all addresses for current user' })
  @ApiResponse({
    status: 200,
    description: 'List of addresses',
    type: [AddressResponseDto],
  })
  async listAddresses(
    @CurrentUser('id') userId: string,
  ): Promise<AddressResponseDto[]> {
    return this.addressService.listAddresses(userId);
  }

  @Get(':addressId')
  @ApiOperation({ summary: 'Get a specific address' })
  @ApiParam({ name: 'addressId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Address details',
    type: AddressResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async getAddress(
    @CurrentUser('id') userId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ): Promise<AddressResponseDto> {
    return this.addressService.getAddress(userId, addressId);
  }

  @Post()
  @ApiOperation({ summary: 'Add a new address' })
  @ApiResponse({
    status: 201,
    description: 'Address created',
    type: AddressResponseDto,
  })
  async addAddress(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.addressService.addAddress(userId, dto);
  }

  @Put(':addressId')
  @ApiOperation({ summary: 'Update an address' })
  @ApiParam({ name: 'addressId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Address updated',
    type: AddressResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async updateAddress(
    @CurrentUser('id') userId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
    @Body() dto: UpdateAddressDto,
  ): Promise<AddressResponseDto> {
    return this.addressService.updateAddress(userId, addressId, dto);
  }

  @Delete(':addressId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an address' })
  @ApiParam({ name: 'addressId', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 204, description: 'Address deleted' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async removeAddress(
    @CurrentUser('id') userId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ): Promise<void> {
    return this.addressService.removeAddress(userId, addressId);
  }

  @Patch(':addressId/default')
  @ApiOperation({ summary: 'Set an address as default' })
  @ApiParam({ name: 'addressId', type: 'string', format: 'uuid' })
  @ApiResponse({
    status: 200,
    description: 'Address set as default',
    type: AddressResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Address not found' })
  async setDefaultAddress(
    @CurrentUser('id') userId: string,
    @Param('addressId', ParseUUIDPipe) addressId: string,
  ): Promise<AddressResponseDto> {
    return this.addressService.setDefaultAddress(userId, addressId);
  }
}
