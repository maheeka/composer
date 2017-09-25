import React from 'react';
import _ from 'lodash';
import PropTypes from 'prop-types';
import classnames from 'classnames';
import ContextMenuTrigger from './../context-menu/ContextMenuTrigger';
import { getContextMenuItems } from './menu';
import { exists } from './../../workspace/fs-util';

export const EDIT_TYPES = {
    NEW: 'new',
    RENAME: 'rename',
};

/**
 * Class to represent a tree node
 */
class TreeNode extends React.Component {

    /**
     * @inheritdoc
     */
    constructor(...args) {
        super(...args);
        this.state = {
            editError: '',
            inputValue: this.props.node.label,
        };
        this.nameInput = undefined;
        this.onEditName = this.onEditName.bind(this);
        this.onEditComplete = this.onEditComplete.bind(this);
    }

    /**
     * @inheritdoc
     */
    componentDidMount() {
        if (!_.isNil(this.nameInput)) {
            this.nameInput.focus();
        }
    }

    /**
     * @inheritdoc
     */
    componentDidUpdate(prevProps, prevState) {
        if (!_.isNil(this.nameInput) && this.state.inputValue === this.props.node.label) {
            this.nameInput.focus();
            if (this.props.node.fileName) {
                this.nameInput.setSelectionRange(0, this.props.node.fileName.length);
            } else {
                this.nameInput.select();
            }
        }
    }

    /**
     * Upon name modifications
     */
    onEditName(e) {
        this.setState({
            inputValue: e.target.value,
        });
    }

     /**
     * Upon escaping edit mode
     */
    onEditEscape() {
        const { node, node: { editType, label }, onNodeDelete } = this.props;
        if (editType === EDIT_TYPES.NEW) {
            onNodeDelete(node);
        } else if (editType === EDIT_TYPES.RENAME) {
            node.enableEdit = false;
            this.setState({
                inputValue: label,
            });
        }
    }

    /**
     * Upon name modification completion
     */
    onEditComplete() {
        const { node, node: { editType }, onNodeDelete } = this.props;
        if (_.isEmpty(this.state.inputValue) && editType === EDIT_TYPES.NEW) {
            onNodeDelete(node);
        } else {
            node.label = this.state.inputValue;
            node.enableEdit = false;
            this.forceUpdate();
            // FIX ME: Implement logic to rename file/folder  or to create file/folder
            // using BE services along with error handling
        }
    }

    /**
     * @inheritdoc
     */
    render() {
        const {
            node,
            node: {
                active,
                collapsed,
                enableEdit = false,
                editType = EDIT_TYPES.NEW,
                type,
                label,
            },
            onClick,
            onDoubleClick,
            children,
        } = this.props;
        const treeNodeHeader = (
            <div
                className={classnames('tree-node-header', { active })}
                onClick={() => {
                    if (!enableEdit) {
                        onClick(node);
                    }
                }}
                onDoubleClick={() => {
                    if (!enableEdit) {
                        onDoubleClick(node);
                    }
                }}
            >
                <div className="tree-node-highlight-row" />
                {!node.loading && <div className="tree-node-arrow" />}
                {node.loading && <i className="tree-node-loading fw fw-loader4 fw-spin" />}
                <i
                    className={
                        classnames(
                            'tree-node-icon',
                            'fw',
                            { 'fw-folder': type === 'folder' },
                            { 'fw-document': type === 'file' }
                        )
                    }
                />
                {enableEdit && <div className="tree-node-focus-highlighter" onClick={this.onEditComplete} />}
                {enableEdit &&
                    <div className={classnames('tree-node-name-input-wrapper', { error: !_.isEmpty(this.state.editError) })} >
                        <input
                            type="text"
                            className={classnames('tree-node-name-input')}
                            spellCheck={false}
                            value={this.state.inputValue}
                            onChange={this.onEditName}
                            onBlur={this.onEditComplete}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    this.onEditComplete();
                                } else if (e.key === 'Escape') {
                                    this.onEditEscape();
                                }
                            }}
                            ref={(nameInput) => {
                                this.nameInput = nameInput;
                            }}
                        />
                        {!_.isEmpty(this.state.editError) && this.nameInput &&
                            <div
                                className="tree-node-name-input-error"
                                style={{
                                    top: this.nameInput.offsetTop + this.nameInput.clientHeight,
                                    left: this.nameInput.offsetLeft,
                                    width: this.nameInput.offsetWidth,
                                }}
                            >
                                <p
                                    style={{
                                        width: this.nameInput.offsetWidth,
                                    }}
                                >
                                    {this.state.editError}
                                </p>
                            </div>
                        }
                    </div>
                }
                {!enableEdit &&
                    <span className="tree-node-label" >
                        {label}
                    </span>
                }
            </div>
        );
        return (
            <div
                className={classnames('tree-node', 'unseletable-content', {
                    collapsed: node.loading || collapsed, empty: !node.children }
                )}
            >
                {this.props.enableContextMenu && !enableEdit &&
                <ContextMenuTrigger
                    id={node.id}
                    menu={getContextMenuItems(node, this.context.command, (targetNode) => {
                        this.props.onNodeUpdate(targetNode);
                    })}
                >
                    {treeNodeHeader}
                </ContextMenuTrigger>
                }
                {(!this.props.enableContextMenu || enableEdit) && treeNodeHeader}
                <div className="tree-node-children">
                    {collapsed ? null : children}
                </div>
            </div>
        );
    }

}

TreeNode.propTypes = {
    node: PropTypes.shape({
        collapsed: PropTypes.bool.isRequired,
        type: PropTypes.string.isRequired,
        label: PropTypes.string.isRequired,
        enableEdit: PropTypes.bool,

    }).isRequired,
    onNodeUpdate: PropTypes.func,
    onNodeDelete: PropTypes.func,
    enableContextMenu: PropTypes.bool,
    children: PropTypes.node,
    onClick: PropTypes.func,
    onDoubleClick: PropTypes.func,
};

TreeNode.defaultProps = {
    enableContextMenu: false,
    onNodeDelete: () => {},
    onNodeUpdate: () => {},
    onClick: () => {},
    onDoubleClick: () => {},
};

TreeNode.contextTypes = {
    history: PropTypes.shape({
        put: PropTypes.func,
        get: PropTypes.func,
    }),
    command: PropTypes.shape({
        on: PropTypes.func,
        dispatch: PropTypes.func,
    }),
};

export default TreeNode;