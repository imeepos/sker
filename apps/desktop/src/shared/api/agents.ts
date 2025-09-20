/**
 * 智能体管理API客户端
 */

import { invoke } from '@tauri-apps/api/core';
import type {
  Agent,
  CreateAgentRequest,
  UpdateAgentRequest,
  AgentWorkHistory,
  AgentPerformanceMetrics,
} from '../types/agent';
import { handleIpcError } from './client';

/**
 * 智能体管理API类
 */
export class AgentsApi {
  /**
   * 创建新智能体
   */
  static async createAgent(
    request: CreateAgentRequest,
    token: string
  ): Promise<Agent> {
    try {
      const result = await invoke<Agent>('create_agent', {
        request,
        token,
      });
      return result;
    } catch (error) {
      throw handleIpcError(error);
    }
  }

  /**
   * 获取智能体列表
   */
  static async getAgents(token: string): Promise<Agent[]> {
    try {
      const result = await invoke<Agent[]>('get_agents', {
        token,
      });
      return result;
    } catch (error) {
      throw handleIpcError(error);
    }
  }

  /**
   * 获取智能体详情
   */
  static async getAgent(agentId: string): Promise<Agent | null> {
    try {
      const result = await invoke<Agent | null>('get_agent', {
        agentId,
      });
      return result;
    } catch (error) {
      throw handleIpcError(error);
    }
  }

  /**
   * 更新智能体
   */
  static async updateAgent(request: UpdateAgentRequest): Promise<Agent> {
    try {
      const result = await invoke<Agent>('update_agent', {
        request,
      });
      return result;
    } catch (error) {
      throw handleIpcError(error);
    }
  }

  /**
   * 删除智能体
   */
  static async deleteAgent(agentId: string): Promise<void> {
    try {
      await invoke<void>('delete_agent', {
        agentId,
      });
    } catch (error) {
      throw handleIpcError(error);
    }
  }

  /**
   * 获取智能体工作历史
   */
  static async getAgentWorkHistory(agentId: string): Promise<AgentWorkHistory[]> {
    try {
      const result = await invoke<AgentWorkHistory[]>('get_agent_work_history', {
        agentId,
      });
      return result;
    } catch (error) {
      throw handleIpcError(error);
    }
  }

  /**
   * 获取智能体性能指标
   */
  static async getAgentPerformanceMetrics(agentId: string): Promise<AgentPerformanceMetrics[]> {
    try {
      const result = await invoke<AgentPerformanceMetrics[]>('get_agent_performance_metrics', {
        agentId,
      });
      return result;
    } catch (error) {
      throw handleIpcError(error);
    }
  }

  /**
   * 更新智能体状态
   */
  static async updateAgentStatus(
    agentId: string,
    status: string
  ): Promise<Agent> {
    return this.updateAgent({
      agent_id: agentId,
      status,
    });
  }

  /**
   * 启动智能体
   */
  static async startAgent(agentId: string): Promise<Agent> {
    return this.updateAgentStatus(agentId, 'working');
  }

  /**
   * 停止智能体
   */
  static async stopAgent(agentId: string): Promise<Agent> {
    return this.updateAgentStatus(agentId, 'idle');
  }

  /**
   * 暂停智能体
   */
  static async pauseAgent(agentId: string): Promise<Agent> {
    return this.updateAgentStatus(agentId, 'paused');
  }

  /**
   * 让智能体下线
   */
  static async offlineAgent(agentId: string): Promise<Agent> {
    return this.updateAgentStatus(agentId, 'offline');
  }
}

/**
 * 默认导出智能体API
 */
export default AgentsApi;