const Queue =  require('bull');
const redisConfig = require('../config/redis');

const jobs = require('../jobs/index');

const queues = Object.values(jobs).map(job =>({
    bull: new Queue(job.key, redisConfig),
    name: job.key,
    options: job.options,
    handle: job.handle,
}))

module.exports={
    queues,
    add(name,data){
        const queue = this.queues.find(queue => queue.name == name);
        return queue.bull.add(data, queue.options);
    },
    process(){
        return this.queues.forEach(queue =>{
            queue.bull.process(queue.handle)
            queue.bull.on('failed', (job,err)=>{
                console.log(`Job failed: ${queue.key}`)
                console.log(job.data)
                console.log(err)
            })
        })
    }
}

/* const jobTicket = require('../jobs/ticket'); */

/* const ticketQueue = new Queue(jobTicket.key,redisConfig);

ticketQueue.on('failed', (job,err)=>{
    console.log('Job failed')
    console.log(job.data)
    console.log(err)
}) */

//module.exports = ticketQueue;


