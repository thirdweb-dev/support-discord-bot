const axios = require('axios');

const { THIRDWEB_SECRET_KEY, NEBULA_API_ENDPOINT } = process.env;

async function getAIResponse(query) {
    try {
        const response = await axios.post(NEBULA_API_ENDPOINT + '/chat', {
            message: query
        }, {
            headers: {
                'Content-Type': 'application/json',
                'x-secret-key': THIRDWEB_SECRET_KEY
            }
        });

    
        const data = response.data;
        
        return data; // Return the data for further use
    } catch (error) {
        console.error('Error:', error);
        throw error; // Re-throw the error for handling in the calling function
    }
}

async function sendAIFeedback(session_id, request_id, helpful) {
   

    const response = await axios.post(NEBULA_API_ENDPOINT + '/feedback', {
        feedback_rating: helpful ? 1 : -1,
        request_id: request_id,
        session_id: session_id

    }, {
        headers: {
            'Content-Type': 'application/json',
            'x-secret-key': THIRDWEB_SECRET_KEY
        }
    });
    return response
 

}

module.exports = { getAIResponse, sendAIFeedback };
