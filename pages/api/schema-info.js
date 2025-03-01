// An endpoint to report Prisma schema information
import { Prisma } from '@prisma/client';

export default function handler(req, res) {
  try {
    // Get Prisma DMMF (The Data Model Meta Format)
    const dmmf = Prisma.dmmf;
    
    // Extract model information without exposing sensitive data
    const models = dmmf.datamodel.models.map(model => ({
      name: model.name,
      fields: model.fields.map(field => ({
        name: field.name,
        type: field.type,
        isRequired: field.isRequired,
        isId: field.isId,
        isList: field.isList,
        isUnique: field.isUnique,
        kind: field.kind,
      })),
    }));
    
    // Provide information about config
    const schemaInfo = {
      models,
      enums: dmmf.datamodel.enums,
      prismaVersion: require('@prisma/client/package.json').version,
      nodeVersion: process.version,
      timestamp: new Date().toISOString(),
    };
    
    res.status(200).json(schemaInfo);
  } catch (error) {
    console.error('Error fetching schema info:', error);
    
    res.status(500).json({
      error: {
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? null : error.stack,
      }
    });
  }
} 