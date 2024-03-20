import { newMockEvent } from "matchstick-as"
import { ethereum, Address, BigInt, Bytes } from "@graphprotocol/graph-ts"
import {
  MultiMinted,
  RoleAdminChanged,
  RoleGranted,
  RoleRevoked
} from "../generated/YokiDispatch/YokiDispatch"

export function createMultiMintedEvent(
  from: Address,
  yokiContract: Address,
  partnerNftContract: Address,
  to: Address,
  omaAmount: BigInt,
  partnerNFTTokenId: BigInt
): MultiMinted {
  let multiMintedEvent = changetype<MultiMinted>(newMockEvent())

  multiMintedEvent.parameters = new Array()

  multiMintedEvent.parameters.push(
    new ethereum.EventParam("from", ethereum.Value.fromAddress(from))
  )
  multiMintedEvent.parameters.push(
    new ethereum.EventParam(
      "yokiContract",
      ethereum.Value.fromAddress(yokiContract)
    )
  )
  multiMintedEvent.parameters.push(
    new ethereum.EventParam(
      "partnerNftContract",
      ethereum.Value.fromAddress(partnerNftContract)
    )
  )
  multiMintedEvent.parameters.push(
    new ethereum.EventParam("to", ethereum.Value.fromAddress(to))
  )
  multiMintedEvent.parameters.push(
    new ethereum.EventParam(
      "omaAmount",
      ethereum.Value.fromUnsignedBigInt(omaAmount)
    )
  )
  multiMintedEvent.parameters.push(
    new ethereum.EventParam(
      "partnerNFTTokenId",
      ethereum.Value.fromUnsignedBigInt(partnerNFTTokenId)
    )
  )

  return multiMintedEvent
}

export function createRoleAdminChangedEvent(
  role: Bytes,
  previousAdminRole: Bytes,
  newAdminRole: Bytes
): RoleAdminChanged {
  let roleAdminChangedEvent = changetype<RoleAdminChanged>(newMockEvent())

  roleAdminChangedEvent.parameters = new Array()

  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "previousAdminRole",
      ethereum.Value.fromFixedBytes(previousAdminRole)
    )
  )
  roleAdminChangedEvent.parameters.push(
    new ethereum.EventParam(
      "newAdminRole",
      ethereum.Value.fromFixedBytes(newAdminRole)
    )
  )

  return roleAdminChangedEvent
}

export function createRoleGrantedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleGranted {
  let roleGrantedEvent = changetype<RoleGranted>(newMockEvent())

  roleGrantedEvent.parameters = new Array()

  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleGrantedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleGrantedEvent
}

export function createRoleRevokedEvent(
  role: Bytes,
  account: Address,
  sender: Address
): RoleRevoked {
  let roleRevokedEvent = changetype<RoleRevoked>(newMockEvent())

  roleRevokedEvent.parameters = new Array()

  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("role", ethereum.Value.fromFixedBytes(role))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("account", ethereum.Value.fromAddress(account))
  )
  roleRevokedEvent.parameters.push(
    new ethereum.EventParam("sender", ethereum.Value.fromAddress(sender))
  )

  return roleRevokedEvent
}
