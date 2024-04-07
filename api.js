import fs from 'fs'

export const getJson = (where) => {
    const data = fs.readFileSync(where)
    return JSON.parse(data)    
}

export const uploadJson = (where, data) => {
    fs.writeFileSync(where, JSON.stringify(data, null, 2))
}