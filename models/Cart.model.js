const mongoose = require('../config/db');

const CartSchema = new mongoose.Schema({
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    items: [{
        courseId: { 
            type: mongoose.Schema.Types.ObjectId, 
            ref: 'Course',
            required: true 
        },
        courseName: { type: String, required: true },
        price: { type: Number, required: true },
        addedAt: { 
            type: Date, 
            default: Date.now 
        }
    }],
    totalPrice: { 
        type: Number, 
        default: 0 
    },
    status: { 
        type: String,
        enum: ['active', 'checkedout', 'abandoned'],
        default: 'active'
    },
    lastModified: { 
        type: Date, 
        default: Date.now 
    },
    expiresAt: { 
        type: Date,
        default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 jours
    }
}, { timestamps: true });

// ✅ Indexes pour performance
CartSchema.index({ userId: 1 });
CartSchema.index({ userId: 1, status: 1 });
CartSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// ✅ Middleware pour mettre à jour totalPrice avant save
CartSchema.pre('save', function(next) {
    this.totalPrice = this.items.reduce((sum, item) => sum + item.price, 0);
    this.lastModified = new Date();
    next();
});

module.exports = mongoose.model('Cart', CartSchema);
