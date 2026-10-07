import { Module } from '@nestjs/common';
import { VectorSearchModule } from '../vector-search/vector-search.module';
import { AgentToolsService } from './agent-tools.service';
import { AgentService } from './agent.service';

@Module({
  imports: [VectorSearchModule],
  providers: [AgentService, AgentToolsService],
  exports: [AgentService],
})
export class AgentModule {}
