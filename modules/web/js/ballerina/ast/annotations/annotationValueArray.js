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
import ASTNode from '../node';

/**
 * Contains children of annotationKeyValue type.
 */
class AnnotationValueArray extends ASTNode {
    constructor(args) {
        super("Annotation-Value-Array");
    }

    toString() {
        let stringVal = "{";
        let annotationKeyValues = [];
        _.forEach(this.getChildren(), function(annotationKeyValue){
            annotationKeyValues.push(annotationKeyValue.toString());
        });
        stringVal += _.join(annotationKeyValues, ", ");
        stringVal += "}";
        return stringVal;
    }
}

export default AnnotationValueArray;
