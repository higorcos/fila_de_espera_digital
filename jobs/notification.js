module.exports = {
    key:'key_notification',
    handle:({data})=>{
       console.log('Notificação: novo item na fila - ',data.token) 
    }
} 