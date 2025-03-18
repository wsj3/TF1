const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get the current month's appointments
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59);
    
    console.log(`\n===== CALENDAR DATA FOR ${startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' })} =====`);
    
    const appointments = await prisma.session.findMany({
      where: {
        startTime: {
          gte: startOfMonth,
          lte: endOfMonth
        }
      },
      include: {
        Client: {
          select: {
            firstName: true,
            lastName: true,
            status: true
          }
        }
      },
      orderBy: {
        startTime: 'asc'
      }
    });
    
    // Group appointments by date
    const appointmentsByDate = {};
    
    appointments.forEach(appointment => {
      const dateKey = appointment.startTime.toLocaleDateString();
      
      if (!appointmentsByDate[dateKey]) {
        appointmentsByDate[dateKey] = [];
      }
      
      appointmentsByDate[dateKey].push(appointment);
    });
    
    // Print appointments by date
    Object.keys(appointmentsByDate).sort((a, b) => new Date(a) - new Date(b)).forEach(date => {
      const appts = appointmentsByDate[date];
      console.log(`\n${date} - ${appts.length} appointments:`);
      
      appts.forEach(appt => {
        const startTime = appt.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const endTime = appt.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const clientName = `${appt.Client.firstName} ${appt.Client.lastName}`;
        const statusColor = getStatusColor(appt.status);
        
        console.log(`  - ${startTime} - ${endTime}: ${clientName} (${statusColor}${appt.status}\x1b[0m)`);
      });
    });
    
    // Summarize appointment information for the calendar
    console.log('\n===== CALENDAR DATA SUMMARY =====');
    console.log(`Total appointments this month: ${appointments.length}`);
    
    // Count by status
    const statusCounts = appointments.reduce((counts, appt) => {
      counts[appt.status] = (counts[appt.status] || 0) + 1;
      return counts;
    }, {});
    
    Object.keys(statusCounts).forEach(status => {
      const statusColor = getStatusColor(status);
      console.log(`${statusColor}${status}\x1b[0m: ${statusCounts[status]} appointments`);
    });
    
    // Count by client
    const clientCounts = appointments.reduce((counts, appt) => {
      const clientName = `${appt.Client.firstName} ${appt.Client.lastName}`;
      counts[clientName] = (counts[clientName] || 0) + 1;
      return counts;
    }, {});
    
    console.log('\nAppointments by client:');
    Object.keys(clientCounts).sort((a, b) => clientCounts[b] - clientCounts[a]).forEach(client => {
      console.log(`  - ${client}: ${clientCounts[client]} appointments`);
    });
    
    // Distribution by day of week
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayDistribution = appointments.reduce((counts, appt) => {
      const day = dayNames[appt.startTime.getDay()];
      counts[day] = (counts[day] || 0) + 1;
      return counts;
    }, {});
    
    console.log('\nAppointments by day of week:');
    dayNames.forEach(day => {
      const count = dayDistribution[day] || 0;
      const barChart = '█'.repeat(Math.floor(count / Math.max(...Object.values(dayDistribution)) * 20));
      console.log(`  - ${day.padEnd(10)}: ${count.toString().padStart(2)} ${barChart}`);
    });
    
    // Time slot popularity
    const timeSlots = appointments.reduce((slots, appt) => {
      const hour = appt.startTime.getHours();
      const slot = hour < 12 ? 'Morning (before 12 PM)' : 
                   hour < 17 ? 'Afternoon (12-5 PM)' : 'Evening (after 5 PM)';
      slots[slot] = (slots[slot] || 0) + 1;
      return slots;
    }, {});
    
    console.log('\nAppointments by time of day:');
    const timeSlotOrder = ['Morning (before 12 PM)', 'Afternoon (12-5 PM)', 'Evening (after 5 PM)'];
    timeSlotOrder.forEach(slot => {
      const count = timeSlots[slot] || 0;
      const percentage = Math.round((count / appointments.length) * 100);
      console.log(`  - ${slot.padEnd(22)}: ${count.toString().padStart(2)} (${percentage}%)`);
    });
    
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Helper function to get color codes for status
function getStatusColor(status) {
  switch (status) {
    case 'COMPLETED': return '\x1b[32m'; // Green
    case 'SCHEDULED': return '\x1b[34m'; // Blue
    case 'CANCELLED': return '\x1b[31m'; // Red
    case 'NO_SHOW': return '\x1b[33m';   // Yellow
    default: return '\x1b[0m';           // Reset
  }
}

main()
  .then(() => console.log('\nCalendar data examination complete!'))
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 