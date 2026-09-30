// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";

/**
 * @title DecentraXAccessControl
 * @notice Role-Based Access Control system for Bharat Electronics Limited (SIH26125)
 * @dev Enforces multi-tier permissions for ADMIN, MANAGER, AUDITOR, and USER on-chain.
 */
contract DecentraXAccessControl is AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MANAGER_ROLE = keccak256("MANAGER_ROLE");
    bytes32 public constant AUDITOR_ROLE = keccak256("AUDITOR_ROLE");
    bytes32 public constant USER_ROLE = keccak256("USER_ROLE");

    event RoleAssigned(bytes32 indexed role, address indexed account, address indexed assignedBy, uint256 timestamp);
    event RoleRevokedFromAccount(bytes32 indexed role, address indexed account, address indexed revokedBy, uint256 timestamp);
    event AccessEvaluated(
        address indexed account,
        string resource,
        string action,
        bool granted,
        string reason,
        uint256 timestamp
    );

    constructor(address initialAdmin) {
        require(initialAdmin != address(0), "Invalid admin address");
        // DEFAULT_ADMIN_ROLE manages all roles
        _grantRole(DEFAULT_ADMIN_ROLE, initialAdmin);
        _grantRole(ADMIN_ROLE, initialAdmin);

        // Configure role hierarchies: ADMIN manages MANAGER, AUDITOR, and USER roles
        _setRoleAdmin(ADMIN_ROLE, DEFAULT_ADMIN_ROLE);
        _setRoleAdmin(MANAGER_ROLE, ADMIN_ROLE);
        _setRoleAdmin(AUDITOR_ROLE, ADMIN_ROLE);
        _setRoleAdmin(USER_ROLE, ADMIN_ROLE);
    }

    /**
     * @notice Assign a role to an address (Only ADMIN)
     */
    function assignRole(bytes32 role, address account) external onlyRole(ADMIN_ROLE) {
        require(account != address(0), "Invalid account address");
        _grantRole(role, account);
        emit RoleAssigned(role, account, msg.sender, block.timestamp);
    }

    /**
     * @notice Revoke a role from an address (Only ADMIN)
     */
    function revokeUserRole(bytes32 role, address account) external onlyRole(ADMIN_ROLE) {
        require(account != address(0), "Invalid account address");
        _revokeRole(role, account);
        emit RoleRevokedFromAccount(role, account, msg.sender, block.timestamp);
    }

    /**
     * @notice Get primary human-readable role of an account
     */
    function getPrimaryRole(address account) external view returns (string memory) {
        if (hasRole(ADMIN_ROLE, account)) return "ADMIN";
        if (hasRole(MANAGER_ROLE, account)) return "MANAGER";
        if (hasRole(AUDITOR_ROLE, account)) return "AUDITOR";
        if (hasRole(USER_ROLE, account)) return "USER";
        return "UNASSIGNED";
    }

    /**
     * @notice Cryptographically evaluates on-chain whether an account has rights to a specific resource & action
     * @dev Used for transparent, verifiable policy checks and interactive audit simulator
     */
    function evaluateAccess(
        address account,
        string calldata resource,
        string calldata action
    ) external returns (bool granted, string memory reason) {
        bytes32 actionHash = keccak256(bytes(action));

        // ADMIN has unconditional operational access
        if (hasRole(ADMIN_ROLE, account)) {
            granted = true;
            reason = "Granted via ADMIN_ROLE (Root clearance)";
        }
        // MANAGER access rules
        else if (hasRole(MANAGER_ROLE, account)) {
            if (
                actionHash == keccak256(bytes("CREATE_ASSET")) ||
                actionHash == keccak256(bytes("ALLOCATE_ASSET")) ||
                actionHash == keccak256(bytes("TRANSFER_ASSET")) ||
                actionHash == keccak256(bytes("VIEW_ASSET"))
            ) {
                granted = true;
                reason = "Granted via MANAGER_ROLE (Asset lifecycle permission)";
            } else if (actionHash == keccak256(bytes("ASSIGN_ROLE")) || actionHash == keccak256(bytes("REVOKE_ROLE"))) {
                granted = false;
                reason = "Denied: MANAGER cannot modify roles (ADMIN required)";
            } else {
                granted = false;
                reason = "Denied: Action not permitted under MANAGER policy";
            }
        }
        // AUDITOR access rules
        else if (hasRole(AUDITOR_ROLE, account)) {
            if (
                actionHash == keccak256(bytes("VERIFY_IDENTITY")) ||
                actionHash == keccak256(bytes("VERIFY_ASSET")) ||
                actionHash == keccak256(bytes("INSPECT_AUDIT_LOGS")) ||
                actionHash == keccak256(bytes("VIEW_ASSET"))
            ) {
                granted = true;
                reason = "Granted via AUDITOR_ROLE (Oversight and verification authority)";
            } else {
                granted = false;
                reason = "Denied: AUDITOR cannot perform state mutation actions";
            }
        }
        // USER access rules
        else if (hasRole(USER_ROLE, account)) {
            if (actionHash == keccak256(bytes("VIEW_ASSIGNED_ASSET")) || actionHash == keccak256(bytes("VIEW_IDENTITY"))) {
                granted = true;
                reason = "Granted via USER_ROLE (Standard verified personnel)";
            } else {
                granted = false;
                reason = "Denied: Elevated privileges required (MANAGER or ADMIN)";
            }
        }
        // UNASSIGNED / UNAUTHORIZED
        else {
            granted = false;
            reason = "Denied: Account lacks registered active role in DecentraX RBAC";
        }

        emit AccessEvaluated(account, resource, action, granted, reason, block.timestamp);
        return (granted, reason);
    }
}
