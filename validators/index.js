const Joi = require('joi');

class Validator {

    vehicles = async (_obj) => {
        const typeSchema = Joi.object({
            type: Joi.string().required().pattern(/^(aviation|army)$/),
            role: Joi.string().required(),
            country: Joi.string().required()
        })
        try{ await typeSchema.validateAsync(_obj); }
        catch(error) { throw error; }
        const { type } =  _obj;
        const rolePatterns = {
            'aviation': /^(all|bombers|fighters|other)$/,
            'army': /^(all|spaa|destroyer|heavy|medium|light|other)$/
        }
        const rolePattern = rolePatterns[type];
        const schema = Joi.object({
            type: Joi.string().required(),
            role: Joi.string().required().pattern(rolePattern),
            country: Joi.string().required().pattern(/^(all|britain|france|germany|italy|japan|usa|ussr)$/)
        })
        return await schema.validateAsync(_obj);
    }

}

module.exports = new Validator();