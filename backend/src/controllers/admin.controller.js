const AdminService = require('../services/admin.service');

class AdminController {
    static async getStats(req, res, next) {
        try {
            const stats = await AdminService.getDashboardStats();
            res.status(200).json({
                success: true,
                data: stats
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = AdminController;