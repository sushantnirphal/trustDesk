package com.trustdesk.controller;

import com.trustdesk.entity.Order;
import com.trustdesk.order.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @GetMapping
    public ResponseEntity<List<Order>> list(@RequestParam(required = false) Long customerId) {
        List<Order> orders = customerId == null
                ? orderService.findAll()
                : orderService.findByCustomerId(customerId);
        return ResponseEntity.ok(orders);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Order> get(@PathVariable Long id) {
        return ResponseEntity.ok(orderService.findById(id));
    }
}
