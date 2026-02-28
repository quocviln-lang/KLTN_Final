const Service = require('../models/Service');

// 1. LẤY TẤT CẢ DỊCH VỤ (Có thể lọc theo type qua query)
exports.getServices = async (req, res) => {
    try {
        const { type } = req.query;
        const filter = { isActive: true };
        if (type) filter.type = type;

        const services = await Service.find(filter).sort({ price: 1 });
        res.status(200).json({ success: true, count: services.length, data: services });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách dịch vụ' });
    }
};

// 2. TẠO DỊCH VỤ MỚI (Admin)
exports.createService = async (req, res) => {
    try {
        const service = await Service.create(req.body);
        res.status(201).json({ success: true, data: service });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 3. CẬP NHẬT DỊCH VỤ (Admin)
exports.updateService = async (req, res) => {
    try {
        const service = await Service.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        if (!service) return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });
        
        res.status(200).json({ success: true, data: service });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

// 4. XÓA DỊCH VỤ (Admin - Hoặc có thể dùng Soft Delete bằng cách set isActive = false)
exports.deleteService = async (req, res) => {
    try {
        const service = await Service.findByIdAndDelete(req.params.id);
        if (!service) return res.status(404).json({ success: false, message: 'Không tìm thấy dịch vụ' });

        res.status(200).json({ success: true, message: 'Xóa dịch vụ thành công' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi khi xóa dịch vụ' });
    }
};