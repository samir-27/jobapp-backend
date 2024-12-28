import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

export type CompanyDocument = Company & Document;

@Schema({timestamps:true })
export class Company {
    @Prop({required:true})
    name:string;

    @Prop({ required: true, unique: true })
    email: string;
  
    @Prop({ required: true })
    password: string;

    @Prop({})
    slogan:string;

    @Prop({})
    description:string;

    @Prop({})
    address:string;

    @Prop({})
    city:string;
}

export const CompanySchema = SchemaFactory.createForClass(Company);