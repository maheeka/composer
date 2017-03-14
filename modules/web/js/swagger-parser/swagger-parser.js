import js_yaml from 'js-yaml';
import BallerinaASTFactory from '../ballerina/ast/ballerina-ast-factory';

class SwaggerParser {

    /**
     * @constructs
     * @param {string} swaggerDefintiion - The swagger defintion as a string. This can be YAML or JSON.
     * @param {boolean} isYaml is the swagger definition a YAML content or not.
     */
    constructor(swaggerDefintiion, isYaml) {
        if (isYaml) {
            this._swaggerJson = js_yaml.safeLoad(swaggerDefintiion);
        } else {
            this._swaggerJson = swaggerDefintiion;
        }
    }

    /**
     *
     */
    mergeToService(serviceDefinition) {
        var existingAnnotations = serviceDefinition.getChildrenOfType(BallerinaASTFactory.isAnnotation);
        this._createInfoAnnotation(existingAnnotations, serviceDefinition);
        console.log(serviceDefinition);

        // TODO : Merging info
        // TODO : Merging host
        // TODO : Merging BasePath
        // TODO : Merging schemes
        // TODO : Merging Consumes
        // TODO : Mergin Produces

    }

    _createInfoAnnotation(existingAnnotations, serviceDefinition) {
        _.forEach(existingAnnotations, function(existingAnnotation) {
            if(_.isEqual(existingAnnotation.getIdentifier(), "Info")) {
                // Removing existing info annotation.
                existingInfoAnnotation.getParent().removeChild(existingInfoAnnotation);
                return false;
            }
        });

        let infoJson = this._swaggerJson.info;
        let infoBAnnotation = BallerinaASTFactory.createAnnotation({identifier: "Info"});
        this._defaultSwaggerToASTConverter(infoJson, infoBAnnotation);
        //
        // infoBAnnotation.addChild(BallerinaASTFactory.createAnnotationKeyValue({key:"title", value:infoJson.title}));
        // infoBAnnotation.addChild(BallerinaASTFactory.createAnnotationKeyValue({key:"version", value:infoJson.version}));
        // infoBAnnotation.addChild(BallerinaASTFactory.createAnnotationKeyValue({key:"description", value:infoJson.description}));
        // infoBAnnotation.addChild(BallerinaASTFactory.createAnnotationKeyValue({key:"termsOfService", value:infoJson.termsOfService}));
        // infoBAnnotation.addChild(BallerinaASTFactory.createAnnotationKeyValue({key:"termsOfService", value:infoJson.termsOfService}));
    }

    _defaultSwaggerToASTConverter(jsonObject, astNode) {
        _.forEach(jsonObject, function(value, key){
            if (_.isPlainObject(value)) {
                let annotationNode = BallerinaASTFactory.createAnnotation({identifier: key});
                this._defaultSwaggerToASTConverter(value, annotationNode);
                astNode.addChild(annotationNode);
            } else if(_.isArrayLikeObject(value)) {
                var valueArray = BallerinaASTFactory.createAnnotationValueArray();
                _.forEach(value, function() {
                    this._defaultSwaggerToASTConverter(value, valueArray);
                });
                astNode.addChild(BallerinaASTFactory.createAnnotationKeyValue({key:key, value: valueArray}));
            } else {
                astNode.addChild(BallerinaASTFactory.createAnnotationKeyValue({key:key, value: value}));
            }
        });
    }
}

export default SwaggerParser;
