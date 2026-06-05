import mongoose, {Schema} from "mongoose"
import { required } from "zod/mini"
const transcriptSchema = new Schema(
    {
        timestamp:{
            type:String,
            required:true,
        },

        speaker:{
            type:String,
            required:true
        },
        text:{
            type:String,
            required:true
        }
    },
    {_id:false}

)
const meetingSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },

    participants: [
      {
        type: String,
        required: true,
      },
    ],

    meetingDate: {
      type: Date,
      required: true,
    },

    transcript: [transcriptSchema],
  },
  {
    timestamps: true,
  }
);
meetingSchema.index({
  meetingDate: -1,
});

export default mongoose.model("Meeting", meetingSchema)