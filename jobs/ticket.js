module.exports = {
    key:'key_ticket',
    options:{
      delay: 100000,
      max: 1,
    },
    handle:({data})=>{
       console.log(data) 
    }
} 