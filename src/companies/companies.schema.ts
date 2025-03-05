import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { Types } from "mongoose";

export type CompanyDocument = Company & Document;

@Schema({ timestamps: true })
export class Company {
    @Prop({ required: true, maxlength: 100 })
    name: string;

    @Prop({ required: true, unique: true, maxlength: 255 })
    email: string;

    @Prop({ required: true, minlength: 8, maxlength: 100 })
    password: string;

    @Prop({ maxlength: 200 })
    slogan: string;

    @Prop({ maxlength: 1000 })
    description: string;

    @Prop({ maxlength: 255 })
    address: string;

    @Prop({ maxlength: 100 })
    city: string;

    @Prop({ maxlength: 50 })
    companySize: string;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
    jobs: Types.ObjectId[];
}

export const CompanySchema = SchemaFactory.createForClass(Company);
