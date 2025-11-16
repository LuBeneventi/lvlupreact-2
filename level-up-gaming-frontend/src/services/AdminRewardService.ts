// level-up-gaming-frontend/src/services/AdminRewardService.ts

import axios from 'axios';
import { Reward, RewardFormData } from '../types/Reward';
import { API_ENDPOINTS } from './api.config';
import { REWARD_TYPES, REWARD_SEASONS } from '../utils/constants';

/**
 * Constantes del servicio (exportadas desde utils/constants)
 */
export { REWARD_TYPES, REWARD_SEASONS };

/**
 * Servicio para gestionar recompensas en el panel administrativo
 */
export const AdminRewardService = {

    /**
     * Obtiene todas las recompensas
     */
    async fetchRewards(): Promise<Reward[]> {
        try {
            const { data } = await axios.get(`${API_ENDPOINTS.REWARDS}/admin`);
            return Array.isArray(data) ? data.reverse() : [];
        } catch (error) {
            throw new Error('Error al cargar las recompensas.');
        }
    },

    /**
     * Crea una nueva recompensa
     */
    async createReward(payload: RewardFormData): Promise<Reward> {
        try {
            const { data } = await axios.post(`${API_ENDPOINTS.REWARDS}/admin`, payload);
            return data;
        } catch (error: any) {
            throw error;
        }
    },

    /**
     * Actualiza una recompensa existente
     */
    async updateReward(rewardId: string, payload: RewardFormData): Promise<Reward> {
        try {
            const { data } = await axios.put(`${API_ENDPOINTS.REWARDS}/${rewardId}/admin`, payload);
            return data;
        } catch (error: any) {
            throw error;
        }
    },

    /**
     * Activa o desactiva una recompensa
     */
    async toggleRewardActive(rewardId: string, isActive: boolean): Promise<Reward> {
        try {
            const { data } = await axios.put(`${API_ENDPOINTS.REWARDS}/${rewardId}/admin`, { isActive });
            return data;
        } catch (error) {
            throw new Error('Fallo al cambiar el estado de la recompensa.');
        }
    },

    /**
     * Elimina una recompensa
     */
    async deleteReward(rewardId: string): Promise<void> {
        try {
            await axios.delete(`${API_ENDPOINTS.REWARDS}/${rewardId}/admin`);
        } catch (error) {
            throw new Error('Fallo al eliminar la recompensa.');
        }
    },
};

export default AdminRewardService;
