import {EventProcessor} from "../eventProcessor";
import {AddEventItem} from "@subsquid/substrate-processor/lib/interfaces/dataSelection";
import {BatchBlock, BatchContext} from "@subsquid/substrate-processor";
import {Store} from "@subsquid/typeorm-store";
import {MarketOrderCanceledEvent} from "../../types/events";
import {Order, OrderStatus} from "../../model";
import {Item} from "../../processor";
import {AggregatedOrdersHandler} from "./aggregatedOrdersHandler";

export class OrderCanceledEventProcessor implements EventProcessor{
    getHandledItemName(): string {
        return "Market.OrderCanceled";
    }

    async process(ctx: BatchContext<Store, AddEventItem<any, any>>, block: BatchBlock<Item>, item: AddEventItem<any, any>) {
        console.log('Order canceled event')
        let e = new MarketOrderCanceledEvent(ctx, item.event)

        if (e.isV1) {
            let parsedEvent = e.asV1
            let order = await ctx.store.get(Order, parsedEvent.orderId.toString())
            if(order) {
                order.status = OrderStatus.CANCELLED
                await AggregatedOrdersHandler.removeOrderFromAggregatedOrders(ctx.store, order);
                await ctx.store.save(order)
            } else {
              throw new Error('No order found')
            }
        } else {
            throw new Error('Unsupported spec')
        }
    }

}