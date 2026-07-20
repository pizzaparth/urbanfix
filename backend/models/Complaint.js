import mongoose from 'mongoose';

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
    required: true,
  },
  changedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  remarks: {
    type: String,
    required: [true, 'Remarks are required for status updates'],
  },
  changedAt: {
    type: Date,
    default: Date.now,
  },
});

const complaintSchema = new mongoose.Schema(
  {
    trackingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    citizenId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A complaint must belong to a citizen'],
    },
    title: {
      type: String,
      required: [true, 'Please provide a title'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Please select a category'],
      trim: true,
    },
    location: {
      type: String,
      required: [true, 'Please provide a location'],
      trim: true,
    },
    images: {
      type: [String],
      validate: {
        validator: function (val) {
          return val.length <= 3;
        },
        message: 'A complaint can have at most 3 images',
      },
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Resolved', 'Rejected'],
      default: 'Pending',
    },
    isPublic: {
      type: Boolean,
      default: false,
    },
    remarks: {
      type: String,
      default: '',
    },
    urgencyLevel: {
      type: String,
      enum: ['High Urgency', 'Medium Urgency', 'Standard Urgency'],
      default: 'Standard Urgency',
    },
    statusHistory: [statusHistorySchema],
  },
  {
    timestamps: true,
  }
);

// Create indexes to optimize query performance on frequent filters
complaintSchema.index({ citizenId: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ location: 1 });
complaintSchema.index({ isPublic: 1 });

const Complaint = mongoose.model('Complaint', complaintSchema);
export default Complaint;
