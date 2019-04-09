const express = require('express');
const router = express.Router();
const csv = require('csvtojson')
const multer = require('multer');
const request = require('request');
const rp = require('request-promise-native');
const Joi = require('joi');

const upload = multer({
    storage: multer.memoryStorage()
})

router.post('/bulk_user_upload', upload.single('myfile'), async(req, res, next) => {

    try {

        //csv file uplode

        const csv_file = String(req.file.buffer);

        //content data

        const data = {
            input: {
                csv_file,
                customer_uuid: req.body.customer_uuid,
                location_uuid: req.body.location_uuid,
                //  accessgroup_uuid: req.body.accessgroup_uuid
            },
            derived: {}
        };

        //covert csv to json

        const new_users = await csv_to_json(data);
        data.derived.new_users = new_users;

        //validation
        await csv_data_valid(new_users);

        //take one data in new_user

        for (var i = 0; i < new_users.length; i++) {

            await add_user(data.input.customer_uuid, data.input.location_uuid,
            // data.input.accessgroup_uuid,
            new_users[i]);

        }
        consol.log(success);
        return res.status(200)
          .send({         
            status: 'SUCCESS',        
            message: 'User Successfully Create',        
            data:new_users    })
            .json(data);

    } catch (error) {

        return res.status(400)
        .send({     
            status: 'Invalid User',
         })
            .json();

    }

});
//csv to json
const csv_to_json = async(data) => {

    const csv_rows = await csv({noheader: false, trim: true, output: "json" }).fromString(data.input.csv_file)

    return csv_rows;

};

//add users
const add_user = async(customer_uuid, location_uuid, user) => {

    try {

        console.log(user);
       // console.log(access_group_uuids);

        await rp({
            method: 'POST',
            // uri: `https://api-users-ml.dev-sequr.io/v1/customer/${customer_uuid}/user`,
            uri: 'http://localhost:8000',
            body: {
                email: (user.email === '')
                    ? null
                    : user.email,
                name: user.name,
                user_locations: [
                    {
                        location_uuid: location_uuid,
                        role: "USER",
                        access_group_uuids: [user.access_group_uuids]
                    }
                ]
            },
            headers: {
                'content-type': 'application/json',
                'Authorization': 'add token'
            },
            json: true // Automatically stringifies the body to JSON
        });

    } catch (error) {

        // POST failed...
        console.error(error.message);
        console.log('fail');

    }

}
csv_data_valid = async(users) => {
    const schema = Joi
        .array()
        .unique()
        .items(Joi.object().keys({
            name: Joi
                .string()
                .regex(/^[a-z]*$/i)
                .required(),
            email: Joi
                .string()
                .email({minDomainAtoms: 2})
                .lowercase()
                .optional()
                .allow('', null),
                accessgroup: Joi
                .string()
                
                .required(),

        }));
    schema.validate(users, (err, value) => {
        if (err) {
            const error = new error('user are not in array')
            throw err;
        }
    })

}

module.exports = router;