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
import React from 'react';
import PropTypes from 'prop-types';
import { Button, Row, Grid, Col } from 'react-bootstrap';
import Dialog from './../../view/Dialog';

/**
 * Confirm Dialog when deleting a file from tree - which is alreay opened in dirty files
 * @extends React.Component
 */
class OpenedFileDeleteConfirmDialog extends React.Component {

    /**
     * @inheritdoc
     */
    constructor(props) {
        super(props);
        this.state = {
            error: '',
            showDialog: true,
        };
        this.onDialogHide = this.onDialogHide.bind(this);
    }

    /**
     * Called when user hides the dialog
     */
    onDialogHide() {
        this.setState({
            error: '',
            showDialog: false,
        });
    }

    /**
     * @inheritdoc
     */
    render() {
        const fileName = `${this.props.file.name}.${this.props.file.extension}`;
        return (
            <Dialog
                show={this.state.showDialog}
                title="Delete Opened File From Disk"
                actions={
                [
                    <Button
                        key='opened-file-delete-confirm-dialog-close-and-delete'
                        onClick={(evt) => {
                            this.onDialogHide();
                            this.props.onConfirm();
                            evt.stopPropagation();
                            evt.preventDefault();
                        }}
                    >
                        {'Close & Delete'}
                    </Button>,
                ]}
                closeAction
                onHide={this.onDialogHide}
                error={this.state.error}
            >
                <Grid fluid>
                    <Row>
                        <Col md={2}>
                            <i className="fw fw-4x fw-warning danger" />
                        </Col>
                        <Col md={10}>
                            <h4 style={{ marginTop: 0 }}>
                                {`Do you want to close the editor tab and delete "${fileName}" from the file system?`}
                            </h4>
                            <p>
                                {`File ${fileName} is already opened in composer
                                ${this.props.file.isDirty ? ' & contains unsaved content' : ''}.`}
                            </p>
                        </Col>
                    </Row>
                </Grid>
            </Dialog>
        );
    }
}

OpenedFileDeleteConfirmDialog.propTypes = {
    file: PropTypes.objectOf(Object).isRequired,
    onConfirm: PropTypes.func.isRequired,
};

export default OpenedFileDeleteConfirmDialog;
