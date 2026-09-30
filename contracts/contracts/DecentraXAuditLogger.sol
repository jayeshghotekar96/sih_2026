// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./DecentraXAccessControl.sol";

/**
 * @title DecentraXAuditLogger
 * @notice Append-only on-chain audit ledger for Bharat Electronics Limited (SIH26125)
 * @dev Provides non-repudiation and cryptographic traceability for security actions.
 */
contract DecentraXAuditLogger {
    DecentraXAccessControl public accessControl;

    struct AuditRecord {
        uint256 id;
        uint256 timestamp;
        string category; // IDENTITY, ACCESS, ASSET, SECURITY_CHECK
        string action;
        address operator;
        address subject;
        string resourceId;
        string details;
        bool success;
    }

    AuditRecord[] private auditLogs;

    event SecurityAuditEvent(
        uint256 indexed id,
        uint256 timestamp,
        string category,
        string action,
        address indexed operator,
        address indexed subject,
        string resourceId,
        string details,
        bool success
    );

    constructor(address accessControlAddress) {
        require(accessControlAddress != address(0), "Invalid access control address");
        accessControl = DecentraXAccessControl(accessControlAddress);
    }

    /**
     * @notice Records an immutable audit log entry
     */
    function recordEvent(
        string calldata category,
        string calldata action,
        address subject,
        string calldata resourceId,
        string calldata details,
        bool success
    ) external returns (uint256) {
        uint256 logId = auditLogs.length + 1;

        AuditRecord memory record = AuditRecord({
            id: logId,
            timestamp: block.timestamp,
            category: category,
            action: action,
            operator: msg.sender,
            subject: subject,
            resourceId: resourceId,
            details: details,
            success: success
        });

        auditLogs.push(record);

        emit SecurityAuditEvent(
            logId,
            block.timestamp,
            category,
            action,
            msg.sender,
            subject,
            resourceId,
            details,
            success
        );

        return logId;
    }

    /**
     * @notice Get total audit records count
     */
    function totalRecords() external view returns (uint256) {
        return auditLogs.length;
    }

    /**
     * @notice Get recent audit records (up to limit)
     */
    function getRecentRecords(uint256 limit) external view returns (AuditRecord[] memory) {
        uint256 count = auditLogs.length;
        if (count == 0) {
            return new AuditRecord[](0);
        }

        uint256 returnCount = limit > count ? count : limit;
        AuditRecord[] memory records = new AuditRecord[](returnCount);

        for (uint256 i = 0; i < returnCount; i++) {
            records[i] = auditLogs[count - 1 - i];
        }

        return records;
    }
}
