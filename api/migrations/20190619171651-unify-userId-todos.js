// const monk = require('monk')
module.exports = {
  async up (db) {
    const todosColl = db.collection('todos')
    await todosColl.aggregate({
      $match: {
        userId: { $type: 'string' }
      }
    }, {
      $convert: {
        input: '$userId',
        to: 'objectid'
      }
    })
  },

  async down (db) {
  }
}
