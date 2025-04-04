const { PrismaClient } = require('@prisma/client')

async function main() {
  const prisma = new PrismaClient()
  
  try {
    // Test the connection
    console.log('Testing database connection...')
    await prisma.$connect()
    console.log('Successfully connected to the database!')
    
    // Create a test client
    const testClient = await prisma.client.create({
      data: {
        name: 'Test Client',
        email: 'test@example.com',
        phone: '123-456-7890'
      }
    })
    console.log('Successfully created test client:', testClient)
    
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

main() 