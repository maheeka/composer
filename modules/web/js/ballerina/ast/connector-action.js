/**
 * Copyright (c) 2017, WSO2 Inc. (http://www.wso2.org) All Rights Reserved.
 *
 * WSO2 Inc. licenses this file to you under the Apache License,
 * Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied. See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */
define(['lodash', './node', 'log', '../utils/common-utils'], function(_, ASTNode, log, CommonUtils){

    /**
     * Constructor for ConnectorAction
     * @param {object} args - Constructor arguments
     * contains {Annotation|ArgumentParameterDefinitionHolder|ReturnParameterDefinitionHolder|Statement|Worker} as children
     * @constructor
     */
    var ConnectorAction = function(args) {
        ASTNode.call(this, 'ConnectorAction');
        this.action_name = _.get(args, 'action_name');
        this.annotations = _.get(args, 'annotations', []);
    };

    ConnectorAction.prototype = Object.create(ASTNode.prototype);
    ConnectorAction.prototype.constructor = ConnectorAction;

    /**
     * Get the name of action
     * @return {string} action_name - Action Name
     */
    ConnectorAction.prototype.getActionName = function () {
        return this.action_name
    };

    /**
     * Get the annotations
     * @return {string[]} annotations - Action Annotations
     */
    ConnectorAction.prototype.getAnnotations = function () {
        return this.annotations
    };

    /**
     * Get the action Arguments
     * @return {Object[]} arguments - Action Arguments
     */
    ConnectorAction.prototype.getArguments = function () {
        return this.getArgumentParameterDefinitionHolder().getChildren();
    };

    ConnectorAction.prototype.getArgumentParameterDefinitionHolder = function () {
        var argParamDefHolder = this.findChild(this.getFactory().isArgumentParameterDefinitionHolder);
        if (_.isUndefined(argParamDefHolder)) {
            argParamDefHolder = this.getFactory().createArgumentParameterDefinitionHolder();
            this.addChild(argParamDefHolder);
        }
        return argParamDefHolder;
    };

    /**
     * Set the Action name
     * @param {string} name - Action Name
     */
    ConnectorAction.prototype.setActionName = function (name, options) {
        this.setAttribute('action_name', name, options);
    };

    /**
     * Set the action annotations
     * @param {string[]} annotations - Action Annotations
     */
    ConnectorAction.prototype.setAnnotations = function (annotations, options) {
        if (!_.isNil(annotations)) {
            this.setAttribute('annotations', annotations, options);
        } else {
            log.warn('Trying to set a null or undefined array to annotations');
        }
    };

    /**
     * Get the variable Declarations
     * @return {VariableDeclaration[]} variableDeclarations
     */
    ConnectorAction.prototype.getVariableDefinitionStatements = function () {
        var variableDefinitionStatements = [];
        var self = this;

        _.forEach(this.getChildren(), function (child) {
            if (self.getFactory().isVariableDefinitionStatement(child)) {
                variableDefinitionStatements.push(child);
            }
        });
        return variableDefinitionStatements;
    };

    /**
     * Remove variable declaration.
     */
    ConnectorAction.prototype.removeVariableDeclaration = function (variableDeclarationIdentifier) {
        var self = this;
        // Removing the variable from the children.
        var variableDeclarationChild = _.find(this.getChildren(), function (child) {
            return self.getFactory().isVariableDeclaration(child)
                && child.getIdentifier() === variableDeclarationIdentifier;
        });
        this.removeChild(variableDeclarationChild);
    };

    /**
     * Adds new variable declaration.
     */
    ConnectorAction.prototype.addVariableDeclaration = function (newVariableDeclaration) {
        var self = this;
        // Get the index of the last variable declaration.
        var index = _.findLastIndex(this.getChildren(), function (child) {
            return self.getFactory().isVariableDeclaration(child);
        });

        // index = -1 when there are not any variable declarations, hence get the index for connector
        // declarations.
        if (index == -1) {
            index = _.findLastIndex(this.getChildren(), function (child) {
                return self.getFactory().isConnectorDeclaration(child);
            });
        }

        this.addChild(newVariableDeclaration, index + 1);
    };

    //// Start of return type functions.

    /**
     * Gets the return type as a string separated by commas.
     * @return {string} - Return types.
     */
    ConnectorAction.prototype.getReturnTypesAsString = function () {
        var returnTypes = [];
        _.forEach(this.getReturnTypes(), function (returnTypeChild) {
            returnTypes.push(returnTypeChild.getParameterDefinitionAsString())
        });

        return _.join(returnTypes, " , ");
    };

    /**
     * Gets the defined return types.
     * @return {ParameterDefinition[]} - Array of return arguments.
     */
    ConnectorAction.prototype.getReturnTypes = function () {
        return this.getReturnParameterDefinitionHolder().getChildren();
    };

    ConnectorAction.prototype.getReturnParameterDefinitionHolder = function () {
        var returnParamDefHolder = this.findChild(this.getFactory().isReturnParameterDefinitionHolder);
        if (_.isUndefined(returnParamDefHolder)) {
            returnParamDefHolder = this.getFactory().createReturnParameterDefinitionHolder();
            this.addChild(returnParamDefHolder);
        }
        return returnParamDefHolder;
    };

    /**
     * Adds a new argument to return type model.
     * @param {string} type - The type of the argument.
     * @param {string} identifier - The identifier of the argument.
     */
    ConnectorAction.prototype.addReturnType = function (type, identifier) {
        var self = this;

        var returnParamDefHolder = this.getReturnParameterDefinitionHolder();

        // Check if there is already a return type with the same identifier.
        if (!_.isUndefined(identifier)) {
            var child = returnParamDefHolder.findChildByIdentifier(true, identifier);
            if (_.isUndefined(child)) {
                var errorString = "An return argument with identifier '" + identifier + "' already exists.";
                log.error(errorString);
                throw errorString;
            }
        }

        // Validating whether return type can be added based on identifiers of other return types.
        if (!_.isUndefined(identifier)) {
            if (!this.hasNamedReturnTypes() && this.hasReturnTypes()) {
                var errorStringWithoutIdentifiers = "Return types without identifiers already exists. Remove them to " +
                    "add return types with identifiers.";
                log.error(errorStringWithoutIdentifiers);
                throw errorStringWithoutIdentifiers;
            }
        } else {
            if (this.hasNamedReturnTypes() && this.hasReturnTypes()) {
                var errorStringWithIdentifiers = "Return types with identifiers already exists. Remove them to add " +
                    "return types without identifiers.";
                log.error(errorStringWithIdentifiers);
                throw errorStringWithIdentifiers;
            }
        }

        var paramDef = this.getFactory().createParameterDefinition({typeName: type, name: identifier});
        returnParamDefHolder.addChild(paramDef, 0);
    };

    ConnectorAction.prototype.hasNamedReturnTypes = function () {
        if (this.getReturnParameterDefinitionHolder().getChildren().length == 0) {
            //if there are no return types in the return type model
            return false;
        } else {
            //check if any of the return types have identifiers
            var indexWithoutIdentifiers = _.findIndex(this.getReturnParameterDefinitionHolder().getChildren(), function (child) {
                return _.isUndefined(child.getName());
            });

            if (indexWithoutIdentifiers !== -1) {
                return false;
            } else {
                return true;
            }
        }
    };

    ConnectorAction.prototype.hasReturnTypes = function () {
        if (this.getReturnParameterDefinitionHolder().getChildren().length > 0) {
            return true;
        } else {
            return false;
        }
    };

    /**
     * Removes return type argument from the return type model.
     * @param {string} modelID - The id of an {Argument} which resides in the return type model.
     */
    ConnectorAction.prototype.removeReturnType = function (modelID) {
        var removeChild = this.getReturnParameterDefinitionHolder().removeChildById(this.getFactory().isParameterDefinition, modelID);

        // Deleting the argument from the AST.
        if (_.isUndefined(removeChild)) {
            var exceptionString = "Could not find a return type with id : " + modelID;
            log.error(exceptionString);
            throw exceptionString;
        }
    };

    //// End of return type functions.

    /**
     * Returns the list of arguments as a string separated by commas.
     * @return {string} - Arguments as string.
     */
    ConnectorAction.prototype.getArgumentsAsString = function () {
        var argsAsString = "";
        var args = this.getArguments();
        _.forEach(args, function(argument, index){
            argsAsString += argument.getTypeName() + " ";
            argsAsString += argument.getName();
            if (args.length - 1 != index) {
                argsAsString += " , ";
            }
        });
        return argsAsString;
    };

    /**
     * Adds new argument to the connector action.
     * @param type - The type of the argument.
     * @param identifier - The identifier of the argument.
     */
    ConnectorAction.prototype.addArgument = function(type, identifier) {
        //creating argument
        var newArgumentParamDef = this.getFactory().createParameterDefinition();
        newArgumentParamDef.setTypeName(type);
        newArgumentParamDef.setName(identifier);

        var argParamDefHolder = this.getArgumentParameterDefinitionHolder();
        var index = argParamDefHolder.getChildren().length;

        argParamDefHolder.addChild(newArgumentParamDef, index + 1);
    };

    /**
     * Removes an argument from a function definition.
     * @param identifier - The identifier of the argument.
     * @return {Array} - The removed argument.
     */
    ConnectorAction.prototype.removeArgument = function(identifier) {
        var argParamDefHolder = this.getArgumentParameterDefinitionHolder();
        argParamDefHolder.removeChildByName(this.getFactory().isParameterDefinition, identifier);
    };

    ConnectorAction.prototype.getConnectionDeclarations = function () {
        var connectorDeclaration = [];
        var self = this;

        _.forEach(this.getChildren(), function (child) {
            if (self.getFactory().isConnectorDeclaration(child)) {
                connectorDeclaration.push(child);
            }
        });
        return _.sortBy(connectorDeclaration, [function (connectorDeclaration) {
            return connectorDeclaration.getConnectorVariable();
        }]);
    };

    ConnectorAction.prototype.getWorkerDeclarations = function () {
        var workerDeclarations = [];
        var self = this;

        _.forEach(this.getChildren(), function (child) {
            if (self.getFactory().isWorkerDeclaration(child)) {
                workerDeclarations.push(child);
            }
        });
        return _.sortBy(workerDeclarations, [function (workerDeclaration) {
            return workerDeclaration.getWorkerName();
        }]);
    };

    /**
     * initialize ConnectorAction from json object
     * @param {Object} jsonNode to initialize from
     * @param {string} [jsonNode.resource_name] - Name of the resource definition
     * @param {string} [jsonNode.annotations] - Annotations of the resource definition
     */
    ConnectorAction.prototype.initFromJson = function (jsonNode) {
        var self = this;
        this.setActionName(jsonNode.action_name, {doSilently: true});
        this.setAnnotations(jsonNode.annotations, {doSilently: true});

        _.each(jsonNode.children, function (childNode) {
            var child = undefined;
            var childNodeTemp = undefined;
            if (childNode.type === "variable_definition_statement" && !_.isNil(childNode.children[1]) && childNode.children[1].type === 'connector_init_expr') {
                child = self.getFactory().createConnectorDeclaration();
                childNodeTemp = childNode;
            } else {
                child = self.getFactory().createFromJson(childNode);
                childNodeTemp = childNode;
            }
            self.addChild(child);
            child.initFromJson(childNodeTemp);
        });
    };

    /**
     * Validates possible immediate child types.
     * @override
     * @param node
     * @return {boolean}
     */
    ConnectorAction.prototype.canBeParentOf = function (node) {
        return this.getFactory().isConnectorDeclaration(node)
            || this.getFactory().isVariableDeclaration(node)
            || this.getFactory().isWorkerDeclaration(node)
            || this.getFactory().isStatement(node);
    };

    /**
     * @inheritDoc
     * @override
     */
    ConnectorAction.prototype.generateUniqueIdentifiers = function () {
        CommonUtils.generateUniqueIdentifier({
            node: this,
            attributes: [{
                defaultValue: "newAction",
                setter: this.setActionName,
                getter: this.getActionName,
                parents: [{
                    // ballerina-ast-node
                    node: this.parent,
                    getChildrenFunc: this.parent.getConnectorActionDefinitions,
                    getter: this.getActionName
                }]
            }]
        });
    };

    /**
     * Get the connector by name
     * @param {string} connectorName
     * @return {ConnectorDeclaration}
     */
    ConnectorAction.prototype.getConnectorByName = function (connectorName) {
        var self = this;
        var connectorReference = _.find(this.getChildren(), function (child) {
            return (self.getFactory().isConnectorDeclaration(child) && (child.getConnectorVariable() === connectorName));
        });

        return !_.isNil(connectorReference) ? connectorReference : this.getParent(). getConnectorByName(connectorName);
    };

    return ConnectorAction;
});
