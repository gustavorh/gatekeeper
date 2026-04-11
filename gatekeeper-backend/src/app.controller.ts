import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  // Root controller for the application
  // Add any application-wide endpoints here if needed
  @Get()
  async getHello(): Promise<string> {
    return 'Hello World';
  }
}
