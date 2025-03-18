const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Get all sessions, sorted by date
    const allSessions = await prisma.session.findMany({
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
    
    // Group sessions by month and status
    const sessionsByMonth = {};
    const today = new Date();
    
    allSessions.forEach(session => {
      const month = session.startTime.toLocaleString('default', { month: 'long' });
      const year = session.startTime.getFullYear();
      const key = `${month} ${year}`;
      
      // Initialize month if not exists
      if (!sessionsByMonth[key]) {
        sessionsByMonth[key] = {
          total: 0,
          completed: 0,
          scheduled: 0,
          cancelled: 0,
          noShow: 0,
          sessions: []
        };
      }
      
      // Add to session counts
      sessionsByMonth[key].total++;
      
      if (session.status === 'COMPLETED') {
        sessionsByMonth[key].completed++;
      } else if (session.status === 'SCHEDULED') {
        sessionsByMonth[key].scheduled++;
      } else if (session.status === 'CANCELLED') {
        sessionsByMonth[key].cancelled++;
      } else if (session.status === 'NO_SHOW') {
        sessionsByMonth[key].noShow++;
      }
      
      // Add session to the month
      sessionsByMonth[key].sessions.push(session);
    });
    
    // Print sessions by month
    console.log('\n===== SESSIONS BY MONTH =====');
    Object.keys(sessionsByMonth).sort().forEach(month => {
      const monthData = sessionsByMonth[month];
      console.log(`\n${month} - Total: ${monthData.total} sessions`);
      console.log(`  Completed: ${monthData.completed}, Scheduled: ${monthData.scheduled}, Cancelled: ${monthData.cancelled}, No-show: ${monthData.noShow}`);
      
      // Show first few sessions in this month
      console.log('  Sample sessions:');
      monthData.sessions.slice(0, 3).forEach(session => {
        const date = session.startTime.toLocaleDateString();
        const time = `${session.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${session.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
        const clientName = `${session.Client.firstName} ${session.Client.lastName}`;
        console.log(`  - ${date}, ${time}: ${clientName} (${session.status})`);
      });
    });
    
    // Get current week's sessions
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999);
    
    const thisWeekSessions = await prisma.session.findMany({
      where: {
        startTime: {
          gte: startOfWeek,
          lte: endOfWeek
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
    
    console.log('\n===== THIS WEEK\'S SCHEDULE =====');
    console.log(`Week of ${startOfWeek.toLocaleDateString()} to ${endOfWeek.toLocaleDateString()}`);
    
    // Group by day of week
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const sessionsByDay = {};
    
    days.forEach(day => {
      sessionsByDay[day] = [];
    });
    
    thisWeekSessions.forEach(session => {
      const day = days[session.startTime.getDay()];
      sessionsByDay[day].push(session);
    });
    
    // Display sessions by day
    days.forEach(day => {
      console.log(`\n${day}:`);
      
      if (sessionsByDay[day].length === 0) {
        console.log('  No sessions scheduled');
      } else {
        sessionsByDay[day].forEach(session => {
          const time = `${session.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${session.endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
          const clientName = `${session.Client.firstName} ${session.Client.lastName}`;
          console.log(`  - ${time}: ${clientName} (${session.status})`);
        });
      }
    });
    
  } catch (error) {
    console.error('Error querying database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .then(() => console.log('\nSession examination complete!'))
  .catch(e => {
    console.error(e);
    process.exit(1);
  }); 