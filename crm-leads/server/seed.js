// Seed script para crear usuario admin inicial
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Lead = require('./models/Lead');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected for seeding');
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    process.exit(1);
  }
};

const seedUsers = async () => {
  try {
    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ role: 'admin' });
    
    if (existingAdmin) {
      console.log('🔍 Admin user already exists:', existingAdmin.username);
      return existingAdmin;
    }

    // Crear usuario admin
    const adminUser = new User({
      username: 'admin',
      email: 'admin@crm-leads.com',
      password: 'admin123', // Cambiar en producción
      name: 'Administrador CRM',
      role: 'admin'
    });

    await adminUser.save();
    console.log('✅ Admin user created successfully');
    console.log('📧 Email: admin@crm-leads.com');
    console.log('🔑 Username: admin');
    console.log('🔐 Password: admin123');
    console.log('⚠️  IMPORTANTE: Cambiar la contraseña en producción');

    return adminUser;
    
  } catch (error) {
    console.error('❌ Error creating admin user:', error.message);
  }
};

const seedSellers = async () => {
  try {
    const existingSellers = await User.countDocuments({ role: 'seller' });
    
    if (existingSellers > 0) {
      console.log(`🔍 Found ${existingSellers} existing sellers, skipping seller creation`);
      return;
    }

    // Crear vendedores de ejemplo
    const sellers = [
      {
        username: 'vendedor1',
        email: 'vendedor1@crm-leads.com',
        password: 'vendedor123',
        name: 'María García',
        role: 'seller'
      },
      {
        username: 'vendedor2', 
        email: 'vendedor2@crm-leads.com',
        password: 'vendedor123',
        name: 'Carlos Rodríguez',
        role: 'seller'
      },
      {
        username: 'vendedor3',
        email: 'vendedor3@crm-leads.com', 
        password: 'vendedor123',
        name: 'Ana López',
        role: 'seller'
      }
    ];

    const createdSellers = await User.insertMany(sellers);
    console.log(`✅ Created ${createdSellers.length} example sellers`);
    
    createdSellers.forEach(seller => {
      console.log(`👤 ${seller.name} (${seller.username}) - ${seller.email}`);
    });

    return createdSellers;

  } catch (error) {
    console.error('❌ Error creating sellers:', error.message);
  }
};

const seedLeads = async () => {
  try {
    const existingLeads = await Lead.countDocuments();
    
    if (existingLeads > 0) {
      console.log(`🔍 Found ${existingLeads} existing leads, skipping lead creation`);
      return;
    }

    // Obtener vendedores para asignar leads
    const sellers = await User.find({ role: 'seller' }).limit(3);
    
    // Leads de ejemplo basados en el CSV real
    const sampleLeads = [
      {
        name: 'Boston Medical Group',
        contact: 'Dr. Juan Pérez',
        phone: '011-2040-0911',
        address: '1430 Marcelo Torcuato de Alvear',
        website: 'https://bostonmedical.com.ar',
        type: 'clinica',
        rating: 2.9,
        status: 'uncontacted',
        assignedTo: sellers[0]?._id
      },
      {
        name: 'CEMEDYT - Diagnóstico Médico',
        contact: 'Dra. Ana Silva',
        phone: '011-4824-4439',
        address: '1773 Avenida Pueyrredón',
        website: 'https://cemedyt.com.ar',
        type: 'clinica',
        rating: 3.9,
        status: 'contacted',
        assignedTo: sellers[1]?._id,
        lastContact: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 días atrás
        notes: 'Interesados en conocer más sobre nuestros servicios'
      },
      {
        name: 'Centro Médico Alas',
        contact: 'Dr. Roberto Martinez',
        phone: '011-4963-3434',
        address: 'San Luis 2740',
        website: 'http://www.centromedicoalas.com.ar',
        type: 'clinica',
        rating: 3.5,
        status: 'interested',
        assignedTo: sellers[2]?._id,
        lastContact: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 día atrás
        nextAction: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // En 3 días
        notes: 'Programar reunión para la próxima semana'
      },
      {
        name: 'Clínica Estética Bella Vista',
        contact: 'Dra. Carmen Vega',
        phone: '011-4567-8901',
        address: 'Av. Santa Fe 1234',
        website: 'https://esteticabellavista.com',
        type: 'estetica',
        rating: 4.5,
        status: 'meeting',
        assignedTo: sellers[0]?._id,
        lastContact: new Date(),
        nextAction: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000), // Mañana
        notes: 'Reunión confirmada para mañana a las 14:00'
      },
      {
        name: 'Centro Dermatológico Norte',
        contact: 'Dr. Luis Fernández',
        phone: '011-3456-7890',
        address: 'Av. Cabildo 2567',
        website: 'https://dermatonorte.com.ar',
        type: 'clinica',
        rating: 4.2,
        status: 'won',
        assignedTo: sellers[1]?._id,
        lastContact: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 semana atrás
        notes: 'Cliente cerrado exitosamente. Contrato firmado por $50,000'
      },
      {
        name: 'Consultorio Dental Sonrisa',
        contact: 'Dr. Miguel Torres',
        phone: '011-2345-6789',
        address: 'Corrientes 1567',
        website: 'https://dentalsonrisa.com',
        type: 'clinica',
        rating: 3.8,
        status: 'lost',
        assignedTo: sellers[2]?._id,
        lastContact: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 semanas atrás
        notes: 'No interesado por el momento. Contactar en 6 meses'
      }
    ];

    // Filtrar leads sin vendedor asignado si no hay vendedores
    const leadsToCreate = sellers.length > 0 ? sampleLeads : 
      sampleLeads.map(lead => ({ ...lead, assignedTo: null }));

    const createdLeads = await Lead.insertMany(leadsToCreate);
    console.log(`✅ Created ${createdLeads.length} example leads`);

    // Actualizar estadísticas de vendedores
    if (sellers.length > 0) {
      for (const seller of sellers) {
        const assignedCount = createdLeads.filter(lead => 
          lead.assignedTo?.toString() === seller._id.toString()
        ).length;
        
        const contactedCount = createdLeads.filter(lead => 
          lead.assignedTo?.toString() === seller._id.toString() && 
          lead.status !== 'uncontacted'
        ).length;

        await User.findByIdAndUpdate(seller._id, {
          totalLeads: assignedCount,
          totalContacted: contactedCount
        });
      }
      console.log('📊 Updated seller statistics');
    }

    return createdLeads;

  } catch (error) {
    console.error('❌ Error creating leads:', error.message);
  }
};

const runSeed = async () => {
  console.log('🌱 Starting database seeding...');
  
  await connectDB();
  
  try {
    // Crear usuarios
    await seedUsers();
    const sellers = await seedSellers();
    
    // Crear leads de ejemplo
    await seedLeads();
    
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📝 Summary:');
    
    const adminCount = await User.countDocuments({ role: 'admin' });
    const sellerCount = await User.countDocuments({ role: 'seller' });
    const leadCount = await Lead.countDocuments();
    
    console.log(`👥 Admins: ${adminCount}`);
    console.log(`🏪 Sellers: ${sellerCount}`);
    console.log(`📋 Leads: ${leadCount}`);
    
    console.log('\n🚀 You can now start the server with:');
    console.log('npm run dev');
    console.log('\n🌐 Then visit: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📡 Database connection closed');
    process.exit(0);
  }
};

// Verificar si se está ejecutando directamente
if (require.main === module) {
  runSeed();
}

module.exports = { runSeed, seedUsers, seedSellers, seedLeads };